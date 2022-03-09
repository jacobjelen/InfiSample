// max values measured on each cell
const mat_max = [
  [82, 52, 45, 46, 26, 19, 20, 14, 14, 12, 19],
  [32, 26, 25, 20, 17, 15, 10, 12, 9, 11, 13],
  [22, 16, 14, 14, 10, 9, 9, 9, 8, 6, 11],
  [15, 12, 11, 11, 11, 10, 12, 9, 11, 6, 10],
  [15, 11, 10, 11, 10, 8, 8, 8, 10, 8, 12],
  [13, 11, 10, 9, 8, 9, 10, 8, 7, 9, 11]
]

// new array where each number is 'maximum number from mat_max' devided by 'number on the same index in mat_max'
// this gives a multiplier. when applied to actual cell reading, this should 'normalise' all values acros the multitouch
const gain = mat_max.map(c => c.map(i => Math.round( 82 / i * 100 ) / 100 ))

console.log(gain)
