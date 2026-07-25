
import { CANDY_TYPES } from './levels';

export class GameBoard {
  constructor(size = 8) {
    this.size = size;
    this.grid = Array(size).fill(null).map(() => Array(size).fill(null));
  }

  reset() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.grid[r][c] = null;
      }
    }
  }

  canFitShape(shapeCells, startRow, startCol) {
    for (let cell of shapeCells) {
      const targetRow = startRow + cell.r;
      const targetCol = startCol + cell.c;

      if (targetRow < 0 || targetRow >= this.size || targetCol < 0 || targetCol >= this.size) {
        return false;
      }

      if (this.grid[targetRow][targetCol] !== null) {
        return false;
      }
    }
    return true;
  }

  placeShape(shapeCells, startRow, startCol, candyColors) {
    shapeCells.forEach((cell, idx) => {
      const r = startRow + cell.r;
      const c = startCol + cell.c;
      this.grid[r][c] = {
        type: candyColors[idx]
      };
    });
  }

  checkLines() {
    const fullRows = [];
    const fullCols = [];

    for (let r = 0; r < this.size; r++) {
      let isRowFull = true;
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === null) {
          isRowFull = false;
          break;
        }
      }
      if (isRowFull) {
        fullRows.push(r);
      }
    }

    for (let c = 0; c < this.size; c++) {
      let isColFull = true;
      for (let r = 0; r < this.size; r++) {
        if (this.grid[r][c] === null) {
          isColFull = false;
          break;
        }
      }
      if (isColFull) {
        fullCols.push(c);
      }
    }

    return { rows: fullRows, cols: fullCols };
  }

  clearLines(fullRows, fullCols) {
    const clearedCells = [];
    const toClear = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

    fullRows.forEach(r => {
      for (let c = 0; c < this.size; c++) {
        toClear[r][c] = true;
      }
    });

    fullCols.forEach(c => {
      for (let r = 0; r < this.size; r++) {
        toClear[r][c] = true;
      }
    });

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (toClear[r][c]) {
          clearedCells.push({
            row: r,
            col: c,
            candy: this.grid[r][c]
          });
          this.grid[r][c] = null;
        }
      }
    }

    return clearedCells;
  }

  hasAnyValidMove(activeShapes) {
    if (activeShapes.length === 0) return true;

    for (let shape of activeShapes) {
      if (!shape) continue;

      let shapeFitsSomewhere = false;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.canFitShape(shape.cells, r, c)) {
            shapeFitsSomewhere = true;
            break;
          }
        }
        if (shapeFitsSomewhere) break;
      }

      if (shapeFitsSomewhere) {
        return true;
      }
    }

    return false;
  }
}
