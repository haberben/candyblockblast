
import { CANDY_TYPES, CANDY_SVGS } from './levels';

const SHAPE_TEMPLATES = [
  { cells: [{ r: 0, c: 0 }] },
  { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }] },
  { cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }] },
  { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }] },
  { cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }] },
  { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }] },
  { cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }] },
  { cells: [{ r: 0, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 0 }] },
  { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }] },
  { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }] },
  { cells: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }] },
  { cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }] }
];

export function generateThreeShapes(levelColorsCount) {
  const allCandyKeys = Object.keys(CANDY_TYPES);
  const allowedCandies = allCandyKeys.slice(0, Math.min(levelColorsCount, allCandyKeys.length));

  const shapes = [];
  for (let i = 0; i < 3; i++) {
    const templateIndex = Math.floor(Math.random() * SHAPE_TEMPLATES.length);
    const template = SHAPE_TEMPLATES[templateIndex];

    const cells = template.cells.map(c => ({ r: c.r, c: c.c }));
    const cellColors = cells.map(() => {
      const idx = Math.floor(Math.random() * allowedCandies.length);
      return allowedCandies[idx];
    });

    const rows = Math.max(...cells.map(c => c.r)) + 1;
    const cols = Math.max(...cells.map(c => c.c)) + 1;

    shapes.push({
      id: i,
      cells,
      cellColors,
      rows,
      cols
    });
  }
  return shapes;
}

export function renderShapeDOM(shape) {
  const container = document.createElement('div');
  container.className = 'drag-shape';
  container.dataset.shapeId = shape.id;
  container.style.gridTemplateRows = `repeat(${shape.rows}, 1fr)`;
  container.style.gridTemplateColumns = `repeat(${shape.cols}, 1fr)`;

  const gridCells = Array(shape.rows).fill(null).map(() => Array(shape.cols).fill(null));

  shape.cells.forEach((cell, idx) => {
    gridCells[cell.r][cell.c] = shape.cellColors[idx];
  });

  for (let r = 0; r < shape.rows; r++) {
    for (let c = 0; c < shape.cols; c++) {
      const cellElement = document.createElement('div');
      cellElement.className = 'drag-cell';
      const candyType = gridCells[r][c];

      if (candyType) {
        cellElement.innerHTML = CANDY_SVGS[candyType];
      } else {
        cellElement.style.opacity = 0;
      }

      container.appendChild(cellElement);
    }
  }

  return container;
}
