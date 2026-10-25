import { pageItems } from './pageItems'

describe('pageItems', () => {
  it('matches the design on the first page', () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 'gap', 5])
  })
  it('shows the window around a middle page', () => {
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(50, 100)).toEqual([1, 'gap', 49, 50, 51, 'gap', 100])
  })
  it('shifts the window at the end', () => {
    expect(pageItems(5, 5)).toEqual([1, 'gap', 3, 4, 5])
  })
  it('handles tiny ranges', () => {
    expect(pageItems(1, 0)).toEqual([])
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(2, 2)).toEqual([1, 2])
  })
})
