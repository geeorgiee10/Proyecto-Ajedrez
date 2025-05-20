// createStockfish.js
export default function createStockfish() {
  return new Worker('src/workers/stockfish.js', { type: 'classic' });
}
