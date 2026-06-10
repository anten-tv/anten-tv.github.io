import { describe, expect, it } from 'vitest'
import { channelChip, channelToMhz } from './freq'

describe('channelToMhz — known answers for the VN UHF raster', () => {
  it('K21 = 474 MHz', () => expect(channelToMhz(21)).toBe(474))
  it('K30 = 546 MHz', () => expect(channelToMhz(30)).toBe(546))
  it('K33 = 570 MHz', () => expect(channelToMhz(33)).toBe(570))
  it('K34 = 578 MHz', () => expect(channelToMhz(34)).toBe(578))
  it('K36 = 594 MHz', () => expect(channelToMhz(36)).toBe(594))
  it('K48 = 690 MHz (top of cleared band)', () =>
    expect(channelToMhz(48)).toBe(690))
})

describe('channelChip', () => {
  it('formats K33', () => expect(channelChip(33)).toBe('K33 — 570 MHz'))
})
