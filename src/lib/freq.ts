// Vietnam UHF DVB-T2 raster: 8 MHz channels, centre frequency derived from
// channel number. Never stored in data — single source of truth is this formula.
export function channelToMhz(channel: number): number {
  return 306 + 8 * channel
}

/** Display chip, e.g. "K33 — 570 MHz". */
export function channelChip(channel: number): string {
  return `K${channel} — ${channelToMhz(channel)} MHz`
}
