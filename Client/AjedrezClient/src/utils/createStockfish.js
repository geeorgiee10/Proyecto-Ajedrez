// createStockfish.js
export default function createStockfish() {
  return new Worker('/stockfish.js', { type: 'classic' });
}
