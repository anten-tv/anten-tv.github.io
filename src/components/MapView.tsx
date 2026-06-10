import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  STYLE_OFFLINE,
  STYLE_URL,
  STYLE_URL_FALLBACK,
  VN_CENTER,
  VN_ZOOM,
} from "../config";
import { loadCoverage, towersToGeoJSON } from "../lib/data";
import { OPERATOR_COLORS, OPERATOR_FALLBACK_COLOR } from "../lib/operators";
import type { LatLon } from "../hooks/useGeolocation";
import type { Tower } from "../types";

interface Props {
  towers: Tower[];
  selectedId: string | null;
  position: LatLon | null;
  showCoverage: boolean;
  pickMode: boolean;
  onSelect: (id: string | null) => void;
  onPick: (lat: number, lon: number) => void;
}

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

// Vietnam territory polygons (simplified, see scripts/generate-vn-boundary.mjs):
// mainland + nearshore islands, and the offshore archipelagos (Hoàng Sa,
// Trường Sa). Cached at module scope so remounts don't refetch.
let vnMainland: GeoJSON.Feature | null = null;
let vnIslands: GeoJSON.Feature | null = null;

// Foreign administrative labels inside the archipelago areas (OSM carries
// them regardless of worldview, some with Vietnamese name tags) — never shown
const BLOCKED_NAMES = [
  "三沙市",
  "三沙",
  "Sansha",
  "Sansha Shi",
  "Tam Sa",
  "Kalayaan",
];

// Mainland labels: Vietnamese name first, then the romanized name. No raw
// `name` fallback — it can leak non-Latin scripts for untransliterated
// features.
const VI_NAME: maplibregl.ExpressionSpecification = [
  "coalesce",
  ["get", "name:vi"],
  ["get", "name:latin"],
];

// Archipelago labels: Vietnamese names only, with the foreign-admin blocklist
const VI_ISLAND_NAME: maplibregl.ExpressionSpecification = [
  "case",
  [
    "any",
    ["in", ["coalesce", ["get", "name"], ""], ["literal", BLOCKED_NAMES]],
    ["in", ["coalesce", ["get", "name:vi"], ""], ["literal", BLOCKED_NAMES]],
  ],
  "",
  ["get", "name:vi"],
];

const ISLAND_LAYER_SUFFIX = "-vnisl";

// Basemap labels outside Vietnamese territory (sea names, foreign places,
// disputed-area names) must not render.
// - Every basemap symbol layer gets an extra ["within", mainland] filter and
//   its labels switched to Vietnamese.
// - Each name-carrying layer is cloned for the archipelagos, restricted to
//   features tagged with a Vietnamese name (["has", "name:vi"]) so
//   foreign-only-named reefs and groups never surface.
// Our own layers are added after this runs and are skipped.
function applyVnLabelMask(map: maplibregl.Map) {
  if (!vnMainland || !vnIslands) return;
  const withinMainland = ["within", vnMainland];
  const withinIslands = ["within", vnIslands];
  for (const layer of map.getStyle().layers) {
    if (
      layer.type !== "symbol" ||
      layer.id === "tower-labels" ||
      layer.id.endsWith(ISLAND_LAYER_SUFFIX)
    )
      continue;
    const existing = map.getFilter(layer.id);
    // only name-based labels — road shields ({ref}) etc. keep their text
    const textField = map.getLayoutProperty(layer.id, "text-field");
    const hasNameText = textField && JSON.stringify(textField).includes("name");

    if (hasNameText && !map.getLayer(layer.id + ISLAND_LAYER_SUFFIX)) {
      const islandFilter: unknown[] = existing
        ? ["all", existing, ["has", "name:vi"], withinIslands]
        : ["all", ["has", "name:vi"], withinIslands];
      map.addLayer({
        ...layer,
        id: layer.id + ISLAND_LAYER_SUFFIX,
        filter: islandFilter as maplibregl.FilterSpecification,
        layout: { ...layer.layout, "text-field": VI_ISLAND_NAME },
      });
    }

    map.setFilter(
      layer.id,
      (existing
        ? ["all", existing, withinMainland]
        : withinMainland) as maplibregl.FilterSpecification,
    );
    if (hasNameText) {
      map.setLayoutProperty(layer.id, "text-field", VI_NAME);
    }
  }
}

export function MapView({
  towers,
  selectedId,
  position,
  showCoverage,
  pickMode,
  onSelect,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);
  // callbacks/state the map event handlers need, without re-binding handlers
  const stateRef = useRef({ pickMode, onSelect, onPick });
  stateRef.current = { pickMode, onSelect, onPick };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: VN_CENTER,
      zoom: VN_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    if (import.meta.env.DEV) {
      // deterministic map control for dev tooling / visual tests
      (window as unknown as { __map?: maplibregl.Map }).__map = map;
    }

    // Style fallback chain — only while the FIRST style hasn't loaded yet
    // (post-load setStyle would wipe our custom sources/layers), and only on
    // errors that look like the style/tiles failing to fetch, so a single
    // transient glyph error doesn't downgrade the whole map. The offline
    // style needs no network at all: tower dots keep working in airplane mode
    // once the SW-cached primary style expires.
    const styleChain: (string | typeof STYLE_OFFLINE)[] = [
      STYLE_URL_FALLBACK,
      STYLE_OFFLINE,
    ];
    map.on("error", (e) => {
      const msg = e.error?.message ?? "";
      const fetchFailure = /style|fetch|network|load/i.test(msg);
      if (!loadedRef.current && fetchFailure && styleChain.length > 0) {
        map.setStyle(styleChain.shift()!);
      }
      console.warn("map error", msg);
    });

    // 'style.load' fires for the initial style AND after every fallback
    // setStyle, so the label mask survives the fallback chain
    map.on("style.load", () => applyVnLabelMask(map));
    if (!vnMainland) {
      fetch(`${import.meta.env.BASE_URL}vn-boundary.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((gj: GeoJSON.FeatureCollection | null) => {
          if (!gj) return;
          vnMainland =
            gj.features.find((f) => f.properties?.part === "mainland") ?? null;
          vnIslands =
            gj.features.find((f) => f.properties?.part === "islands") ?? null;
          // style may have finished loading while the boundary was in flight
          if (map.isStyleLoaded()) applyVnLabelMask(map);
        })
        .catch(() => {});
    }

    map.on("load", () => {
      loadedRef.current = true;
      map.addSource("towers", { type: "geojson", data: EMPTY_FC });
      map.addSource("coverage", { type: "geojson", data: EMPTY_FC });

      map.addLayer({
        id: "coverage-fill",
        type: "fill",
        source: "coverage",
        paint: { "fill-color": "#2563eb", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "coverage-line",
        type: "line",
        source: "coverage",
        paint: {
          "line-color": "#2563eb",
          "line-opacity": 0.5,
          "line-width": 1.5,
        },
      });
      map.addLayer({
        id: "tower-dots",
        type: "circle",
        source: "towers",
        paint: {
          "circle-radius": 9,
          // operator color when active; status overrides it otherwise
          "circle-color": [
            "case",
            ["==", ["get", "status"], "inactive"],
            "#9ca3af",
            ["==", ["get", "status"], "unknown"],
            "#d97706",
            [
              "match",
              ["get", "operator"],
              ...Object.entries(OPERATOR_COLORS).flat(),
              OPERATOR_FALLBACK_COLOR,
            ],
          ] as unknown as maplibregl.ExpressionSpecification,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "tower-labels",
        type: "symbol",
        source: "towers",
        layout: {
          "text-field": ["get", "channels"],
          "text-size": 10,
          "text-offset": [0, 1.6],
          "text-font": ["Noto Sans Regular"],
          "text-optional": true,
        },
        paint: {
          "text-color": "#374151",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      });

      map.on("click", "tower-dots", (e) => {
        if (stateRef.current.pickMode) return;
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) stateRef.current.onSelect(id);
      });
      map.on("click", (e) => {
        if (stateRef.current.pickMode) {
          stateRef.current.onPick(e.lngLat.lat, e.lngLat.lng);
          return;
        }
        const hits = map.queryRenderedFeatures(e.point, {
          layers: ["tower-dots"],
        });
        if (hits.length === 0) stateRef.current.onSelect(null);
      });
      map.on("mouseenter", "tower-dots", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "tower-dots", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      userMarker.current = null;
      loadedRef.current = false;
    };
  }, []);

  // towers → source data
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("towers") as
        | maplibregl.GeoJSONSource
        | undefined;
      src?.setData(towersToGeoJSON(towers));
    };
    if (loadedRef.current) apply();
    else map.once("load", apply);
  }, [towers]);

  // user position dot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = `user-dot user-dot-${position.kind}`;
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([position.lon, position.lat])
        .addTo(map);
      map.flyTo({ center: [position.lon, position.lat], zoom: 9 });
    } else {
      userMarker.current.getElement().className = `user-dot user-dot-${position.kind}`;
      userMarker.current.setLngLat([position.lon, position.lat]);
    }
  }, [position]);

  // selected tower → coverage polygon (precomputed, fetched lazily, SW-cached)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    const apply = () => {
      const src = map.getSource("coverage") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (cancelled || !src) return;
      if (!showCoverage || !selectedId) {
        src.setData(EMPTY_FC);
        return;
      }
      loadCoverage(selectedId).then((gj) => {
        if (!cancelled) src.setData(gj ?? EMPTY_FC);
      });
    };

    // a tower can be selected (via the list) before the style finishes loading
    if (loadedRef.current) apply();
    else map.once("load", apply);
    return () => {
      cancelled = true;
    };
  }, [selectedId, showCoverage]);

  return (
    <div
      ref={containerRef}
      className={`map-container${pickMode ? " map-pick-mode" : ""}`}
    />
  );
}
