import isEqual from 'lodash.isequal'

export const shallowDiffCoords = (coords1, coords2) => {
  if (isEqual(coords1, coords2)) return true
  let [x1, y1] = coords1.toArray()
  let [x2, y2] = coords2.toArray()
  const xLen = getCoordsMaxLen(x1, x2)
  x1 = x1.toFixed(xLen)
  x2 = x2.toFixed(xLen)
  const yLen = getCoordsMaxLen(y1, y2)
  y1 = y1.toFixed(yLen)
  y2 = y2.toFixed(yLen)
  return x1 === x2 && y1 === y2
}

const getCoordsMaxLen = (p1, p2) => {
  const len1 = getDecimalsLen(p1)
  const len2 = getDecimalsLen(p2)
  const safeLen = Math.max(len1, len2) - 3
  return Math.max(safeLen, 0)
}

const getDecimalsLen = (num) => {
  const str = num.toString()
  const decimals = str.split('.')[1]
  return decimals.length
}
