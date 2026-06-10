# lapdattruyenhinhkts.com — Tần số và trạm phát DVB-T2

Source: <https://lapdattruyenhinhkts.com/tan-so-va-tram-phat-dvb-t2.html>
Fetched: 2026-06-10. No publish date on page; content appears old (pre-2020: still lists AVG DVB-T and VTC stations).

Page contains one big table: STT | Tỉnh/TP | Chiều cao anten (m) | Công suất | Đơn vị | Kênh | Chuẩn | Địa điểm.

## VTV DVB-T2 rows (only 4 in entire table)

| Tỉnh/TP | Cao (m) | Công suất | Kênh | Địa điểm |
|---|---|---|---|---|
| Bình Dương | 180 | 5000W | 25 | Đài phát sóng, xã An Thạnh, huyện Thuận An, Bình Dương |
| Cần Thơ | 98 | 2kW | 45 | 215, đường 30/4, thành phố Cần Thơ |
| Đà Nẵng | 75 | 2000W | 49 | Đài phát sóng quốc gia Sơn Trà, điểm cao 620, bán đảo Sơn Trà, Thọ Quang, Sơn Trà, Đà Nẵng |
| Hải Phòng | 45 | 2kW | 43 | Đồi Thiên Văn, Kiến An, Hải Phòng |

## Decisions

- VTC rows ignored: VTC terrestrial network shut down.
- AVG rows ignored: paid service only.
- K49 Đà Nẵng NOT added as mux: channel > 48, 700MHz band (694–806) cleared in VN for mobile; recorded as note on existing `da-nang-son-tra` tower (which already has VTV K30).
- Added towers: `binh-duong-an-thanh` (K25), `can-tho-vtv` (K45), `hai-phong-thien-van` (K43). All `verified: false`, `sourceDate: null`.
- Power column looks like TPO, not ERP → kept `erpKw: null`, power noted in `notes`.

## Coordinates

- Đồi Thiên Văn: OSM node "Trạm Khí tượng Phù Liễn" (man_made=monitoring_station) 20.805794, 106.629969.
- VTV Cần Thơ: OSM node "Trung tâm truyền hình Việt Nam" 10.018329, 105.767745 — same campus area as Đài PTTH Cần Thơ (existing SDTV tower `can-tho-ninh-kieu` ~100 m away; addresses differ: 215 vs 409 đường 30/4).
- An Thạnh: OSM has no tower in bbox (10.92–10.98, 106.66–106.73) except existing Đài PTTH Bình Dương mast. Used UBND phường An Thạnh 10.9457287, 106.6898281 as approximation — needs field verification.
