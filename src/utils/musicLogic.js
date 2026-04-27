export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MAJOR_INTERVALS = [2, 2, 1, 2, 2, 2, 1];
const MINOR_INTERVALS = [2, 1, 2, 2, 1, 2, 2];

// Base index finger frets for the Key of C
export const SHAPE_BASES = {
  'C': 0,
  'A': 2,
  'G': 5,
  'E': 7,
  'D': 9
};

// Open strings tuning: e, B, G, D, A, E
export const STRING_ROOTS = [
  4,  // 1st string (e)
  11, // 2nd string (B)
  7,  // 3rd string (G)
  2,  // 4th string (D)
  9,  // 5th string (A)
  4   // 6th string (E)
];

// Get scale notes (indices)
export function getScale(keyIndex, isMinor) {
  const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
  let scale = [keyIndex];
  let current = keyIndex;
  for (let i = 0; i < 6; i++) {
    current = (current + intervals[i]) % 12;
    scale.push(current);
  }
  return scale;
}

// Get pentatonic notes (indices) from scale
export function getPentatonic(scale, isMinor) {
  if (isMinor) {
    // Minor pentatonic: 1, 3, 4, 5, 7 (indices 0, 2, 3, 4, 6)
    return [scale[0], scale[2], scale[3], scale[4], scale[6]];
  } else {
    // Major pentatonic: 1, 2, 3, 5, 6 (indices 0, 1, 2, 4, 5)
    return [scale[0], scale[1], scale[2], scale[4], scale[5]];
  }
}

// Returns [minFret, maxFret] bounds for a given shape and key
export function getShapeFretWindow(shape, keyIndex) {
  const baseFret = (SHAPE_BASES[shape] + keyIndex) % 12;
  return [baseFret, baseFret + 4];
}

// Get chord tones (1st, 3rd, 5th) from scale
export function getChordTones(scale) {
  return [scale[0], scale[2], scale[4]];
}

