/** Candy Block Blast - core game logic (pure, UI-free) */

export const SIZE = 8;

export type CandyId = 0 | 1 | 2 | 3 | 4 | 5;
export type Cell = CandyId | null;
export type Board = Cell[];

export const CANDIES: { id: CandyId; name: string }[] = [
  { id: 0, name: "Şeker Değirmeni" },
  { id: 1, name: "Jöle" },
  { id: 2, name: "Yeşil Yastık" },
  { id: 3, name: "Portakal Damla" },
  { id: 4, name: "Lolipop" },
  { id: 5, name: "Mavi Top" },
];

export type Shape = { w: number; h: number; cells: [number, number][] };

const S = (rows: string[]): Shape => {
  const cells: [number, number][] = [];
  rows.forEach((r, y) => r.split("").forEach((c, x) => c !== "." && cells.push([x, y])));
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length, cells };
};

export const SHAPES: Shape[] = [
  S(["x"]),
  S(["xx"]),
  S(["x", "x"]),
  S(["xxx"]),
  S(["x", "x", "x"]),
  S(["xxxx"]),
  S(["x", "x", "x", "x"]),
  S(["xxxxx"]),
  S(["x", "x", "x", "x", "x"]),
  S(["xx", "xx"]),
  S(["xxx", "xxx", "xxx"]),
  S(["x.", "xx"]),
  S([".x", "xx"]),
  S(["xx", "x."]),
  S(["xx", ".x"]),
  S(["x..", "x..", "xxx"]),
  S(["..x", "..x", "xxx"]),
  S(["xxx", "x..", "x.."]),
  S(["xxx", "..x", "..x"]),
  S([".x.", "xxx"]),
  S(["xx.", ".xx"]),
  S([".xx", "xx."]),
];

export type Piece = { uid: string; shape: Shape; candy: CandyId };

export type Level = {
  index: number;
  targetCandy: CandyId;
  targetCount: number;
  moves: number;
};

export function makeLevel(index: number): Level {
  const targetCandy = (index * 3) % 6 as CandyId;
  return {
    index,
    targetCandy,
    targetCount: 20 + index * 8,
    moves: Math.max(14, 30 - index),
  };
}

export const emptyBoard = (): Board => Array<Cell>(SIZE * SIZE).fill(null);

let seq = 0;
export function randomPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const candy = Math.floor(Math.random() * 6) as CandyId;
  seq += 1;
  return { uid: `p${seq}_${Math.random().toString(36).slice(2, 7)}`, shape, candy };
}

export const newTray = (): Piece[] => [randomPiece(), randomPiece(), randomPiece()];

export function canPlaceAt(board: Board, piece: Piece, ox: number, oy: number): boolean {
  return piece.shape.cells.every(([x, y]) => {
    const cx = ox + x;
    const cy = oy + y;
    return cx >= 0 && cy >= 0 && cx < SIZE && cy < SIZE && board[cy * SIZE + cx] === null;
  });
}

export function canPlaceAnywhere(board: Board, piece: Piece): boolean {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) if (canPlaceAt(board, piece, x, y)) return true;
  return false;
}

export type PlaceResult = {
  board: Board;
  clearedRows: number[];
  clearedCols: number[];
  clearedIndices: number[];
  collected: Record<number, number>;
  gained: number;
  lines: number;
};

/** Places a piece and resolves full row/column clears. Assumes placement is valid. */
export function placePiece(
  board: Board,
  piece: Piece,
  ox: number,
  oy: number,
  combo: number,
): PlaceResult {
  const next = board.slice();
  piece.shape.cells.forEach(([x, y]) => {
    next[(oy + y) * SIZE + (ox + x)] = piece.candy;
  });

  const clearedRows: number[] = [];
  const clearedCols: number[] = [];
  for (let r = 0; r < SIZE; r++) {
    let full = true;
    for (let c = 0; c < SIZE; c++) if (next[r * SIZE + c] === null) full = false;
    if (full) clearedRows.push(r);
  }
  for (let c = 0; c < SIZE; c++) {
    let full = true;
    for (let r = 0; r < SIZE; r++) if (next[r * SIZE + c] === null) full = false;
    if (full) clearedCols.push(c);
  }

  const idx = new Set<number>();
  clearedRows.forEach((r) => {
    for (let c = 0; c < SIZE; c++) idx.add(r * SIZE + c);
  });
  clearedCols.forEach((c) => {
    for (let r = 0; r < SIZE; r++) idx.add(r * SIZE + c);
  });

  const collected: Record<number, number> = {};
  idx.forEach((i) => {
    const v = next[i];
    if (v !== null) collected[v] = (collected[v] ?? 0) + 1;
  });

  const clearedIndices = [...idx];
  const lines = clearedRows.length + clearedCols.length;
  const comboMul = lines > 0 ? combo + 1 : 1;
  const gained =
    piece.shape.cells.length * 10 + lines * lines * 100 * comboMul + clearedIndices.length * 5;

  clearedIndices.forEach((i) => {
    next[i] = null;
  });

  return { board: next, clearedRows, clearedCols, clearedIndices, collected, gained, lines };
}
