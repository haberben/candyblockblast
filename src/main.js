
import { GameBoard } from './board';
import { generateThreeShapes, renderShapeDOM } from './blocks';
import { LEVELS, saveLevelProgress, getLevelsState, CANDY_TYPES, CANDY_SVGS } from './levels';
import { ParticleEngine } from './particles';
import { sound } from './audio';
import { GameUI } from './ui';

class GameController {
  constructor() {
    this.board = new GameBoard(8);
    this.currentLevel = null;
    this.score = 0;
    this.moves = 0;
    this.targetCollected = 0;
    this.activeShapes = [null, null, null];
    this.consecutiveCombos = 0;
    this.draggedShape = null;
    this.draggedElement = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.elementStartX = 0;
    this.elementStartY = 0;
    this.init();
  }

  init() {
    const canvas = document.getElementById('vfx-canvas');
    this.particles = new ParticleEngine(canvas);
    this.particles.loop();

    this.ui = new GameUI({
      onToggleMute: () => sound.toggleMute(),
      onGoToMap: () => this.goToMap(),
      onStartLevel: (id) => this.startLevel(id),
      onNextLevel: () => this.nextLevel(),
      onRetryLevel: () => this.retryLevel()
    });

    this.createGridDOM();
    this.ui.renderLevelsMap();
    this.ui.showScreen('map');
    this.setupDragAndDrop();

    const resumeAudio = () => {
      sound.init();
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
  }

  goToMap() {
    sound.playClick();
    this.ui.renderLevelsMap();
    this.ui.showScreen('map');
  }

  startLevel(levelId) {
    sound.playClick();
    sound.startBGM();

    const lvl = LEVELS.find(l => l.id === levelId);
    this.currentLevel = lvl;
    this.score = 0;
    this.moves = lvl.moves;
    this.targetCollected = 0;
    this.consecutiveCombos = 0;
    this.board.reset();

    this.drawBoardDOM();
    this.generateNewShapes();
    this.updateUIStats();
    this.ui.showScreen('game');
  }

  retryLevel() {
    this.startLevel(this.currentLevel.id);
  }

  nextLevel() {
    const nextId = this.currentLevel.id + 1;
    const nextLvl = LEVELS.find(l => l.id === nextId);
    if (nextLvl) {
      this.startLevel(nextId);
    } else {
      alert("Tebrikler! Tum seviyeleri tamamladiniz!");
      this.goToMap();
    }
  }

  createGridDOM() {
    const boardContainer = document.getElementById('board-container');
    boardContainer.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        boardContainer.appendChild(cell);
      }
    }
  }

  drawBoardDOM() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      const cellData = this.board.grid[r][c];

      cell.innerHTML = '';
      cell.classList.remove('has-candy');

      if (cellData) {
        cell.innerHTML = CANDY_SVGS[cellData.type];
        cell.classList.add('has-candy');
      }
    });
  }

  generateNewShapes() {
    const shapesContainer = document.getElementById('shapes-container');
    shapesContainer.innerHTML = '';
    this.activeShapes = generateThreeShapes(this.currentLevel.colorsCount);

    this.activeShapes.forEach(shape => {
      const shapeDOM = renderShapeDOM(shape);
      shapesContainer.appendChild(shapeDOM);
    });

    this.checkGameStatus();
  }

  updateUIStats() {
    this.ui.updateStats(
      this.score,
      this.moves,
      this.targetCollected,
      this.currentLevel.target.amount,
      this.currentLevel.target.type,
      this.currentLevel.target.label
    );
  }

  setupDragAndDrop() {
    const shapesContainer = document.getElementById('shapes-container');

    const onDragStart = (e) => {
      const dragShape = e.target.closest('.drag-shape');
      if (!dragShape || this.draggedElement) return;

      const shapeId = parseInt(dragShape.dataset.shapeId);
      const shape = this.activeShapes[shapeId];
      if (!shape) return;

      this.draggedShape = shape;
      this.draggedElement = dragShape;
      dragShape.classList.add('dragging');

      const pointer = e.type.startsWith('touch') ? e.touches[0] : e;
      this.dragStartX = pointer.clientX;
      this.dragStartY = pointer.clientY;

      const rect = dragShape.getBoundingClientRect();
      this.elementStartX = rect.left;
      this.elementStartY = rect.top;

      dragShape.style.position = 'fixed';
      dragShape.style.left = `${rect.left}px`;
      dragShape.style.top = `${rect.top}px`;
      dragShape.style.width = `${rect.width}px`;
      dragShape.style.height = `${rect.height}px`;
      dragShape.style.zIndex = 1000;

      sound.playClick();
      if (e.cancelable) e.preventDefault();
    };

    const onDragMove = (e) => {
      if (!this.draggedElement) return;

      const pointer = e.type.startsWith('touch') ? e.touches[0] : e;
      const dx = pointer.clientX - this.dragStartX;
      const dy = pointer.clientY - this.dragStartY;

      this.draggedElement.style.left = `${this.elementStartX + dx}px`;
      this.draggedElement.style.top = `${this.elementStartY + dy}px`;

      this.clearHighlights();

      const fitCell = this.getHoveredGridCell(pointer.clientX, pointer.clientY);
      if (fitCell) {
        const { r, c } = fitCell;
        if (this.board.canFitShape(this.draggedShape.cells, r, c)) {
          this.highlightGridCells(this.draggedShape.cells, r, c, 'can-fit');
        } else {
          this.highlightGridCells(this.draggedShape.cells, r, c, 'no-fit');
        }
      }

      if (e.cancelable) e.preventDefault();
    };

    const onDragEnd = (e) => {
      if (!this.draggedElement) return;

      const pointer = e.type.startsWith('touch') ? (e.changedTouches[0] || e.touches[0]) : e;
      const fitCell = this.getHoveredGridCell(pointer.clientX, pointer.clientY);

      let placed = false;

      if (fitCell) {
        const { r, c } = fitCell;
        if (this.board.canFitShape(this.draggedShape.cells, r, c)) {
          this.board.placeShape(this.draggedShape.cells, r, c, this.draggedShape.cellColors);
          placed = true;
          sound.playPlace();

          const idx = this.activeShapes.findIndex(s => s && s.id === this.draggedShape.id);
          this.activeShapes[idx] = null;
          this.draggedElement.remove();

          this.moves--;
          this.drawBoardDOM();
          this.checkAndClearLines();
          this.updateUIStats();

          if (this.activeShapes.every(s => s === null)) {
            this.generateNewShapes();
          }

          this.checkGameStatus();
        }
      }

      if (!placed) {
        this.draggedElement.classList.remove('dragging');
        this.draggedElement.style.position = '';
        this.draggedElement.style.left = '';
        this.draggedElement.style.top = '';
        this.draggedElement.style.width = '';
        this.draggedElement.style.height = '';
        this.draggedElement.style.zIndex = '';
        sound.playClick();
      }

      this.clearHighlights();
      this.draggedShape = null;
      this.draggedElement = null;
    };

    shapesContainer.addEventListener('mousedown', onDragStart);
    shapesContainer.addEventListener('touchstart', onDragStart, { passive: false });

    window.addEventListener('mousemove', onDragMove, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });

    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);
  }

  getHoveredGridCell(clientX, clientY) {
    const elem = document.elementFromPoint(clientX, clientY);
    if (!elem) return null;

    const cell = elem.closest('.grid-cell');
    if (cell) {
      return {
        r: parseInt(cell.dataset.row),
        c: parseInt(cell.dataset.col)
      };
    }
    return null;
  }

  highlightGridCells(cells, startRow, startCol, className) {
    cells.forEach(cell => {
      const r = startRow + cell.r;
      const c = startCol + cell.c;
      const gridCell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
      if (gridCell) {
        gridCell.classList.add(className);
      }
    });
  }

  clearHighlights() {
    const gridCells = document.querySelectorAll('.grid-cell');
    gridCells.forEach(cell => {
      cell.classList.remove('can-fit', 'no-fit');
    });
  }

  checkAndClearLines() {
    const { rows, cols } = this.board.checkLines();
    const totalLines = rows.length + cols.length;

    if (totalLines > 0) {
      this.consecutiveCombos++;
      sound.playBlast();
      if (this.consecutiveCombos > 1) {
        sound.playCombo(this.consecutiveCombos);
      }

      const cleared = this.board.clearLines(rows, cols);
      const basePoints = cleared.length * 100;
      const comboMultiplier = Math.max(1, this.consecutiveCombos);
      const gainedScore = basePoints * comboMultiplier;
      this.score += gainedScore;

      const boardContainer = document.getElementById('board-container').getBoundingClientRect();
      const avgX = boardContainer.left + boardContainer.width / 2;
      const avgY = boardContainer.top + boardContainer.height / 2;
      
      let textAlert = "CANDY BLAST!";
      if (totalLines >= 3) textAlert = "FANTASTIK!";
      else if (totalLines >= 2) textAlert = "NEFIS!";
      
      this.particles.addText(
        textAlert,
        avgX,
        avgY - 40,
        1.2 + (totalLines * 0.1),
        `+${gainedScore.toLocaleString()}`
      );

      if (this.consecutiveCombos > 1) {
        this.ui.showCombo(this.consecutiveCombos);
      }

      const targetBox = document.getElementById('target-icon-box').getBoundingClientRect();
      const targetEndX = targetBox.left + targetBox.width / 2;
      const targetEndY = targetBox.top + targetBox.height / 2;

      cleared.forEach(item => {
        const cellEl = document.querySelector(`.grid-cell[data-row="${item.row}"][data-col="${item.col}"]`);
        if (cellEl) {
          const rect = cellEl.getBoundingClientRect();
          const cellX = rect.left + rect.width / 2;
          const cellY = rect.top + rect.height / 2;

          let candyColor = '#ff6b6b';
          if (item.candy.type === CANDY_TYPES.blue_wrapped) candyColor = '#00a2ff';
          if (item.candy.type === CANDY_TYPES.lemon_slice) candyColor = '#ffea3b';
          if (item.candy.type === CANDY_TYPES.green_jelly) candyColor = '#00cc44';
          if (item.candy.type === CANDY_TYPES.orange_wrap) candyColor = '#ff7300';
          if (item.candy.type === CANDY_TYPES.peppermint) candyColor = '#e60000';
          if (item.candy.type === CANDY_TYPES.purple_drop) candyColor = '#990099';

          this.particles.addExplosion(cellX, cellY, candyColor);

          if (item.candy.type === this.currentLevel.target.type) {
            this.targetCollected++;
            this.particles.addScoreFly(cellX, cellY, targetEndX, targetEndY, candyColor);
          }
        }
      });

      this.drawBoardDOM();
    } else {
      this.consecutiveCombos = 0;
    }
  }

  checkGameStatus() {
    if (this.targetCollected >= this.currentLevel.target.amount) {
      sound.stopBGM();
      sound.playWin();
      saveLevelProgress(this.currentLevel.id, this.score, true);
      this.ui.showWinModal(this.score);
      return;
    }

    if (this.moves <= 0) {
      sound.stopBGM();
      sound.playLose();
      this.ui.showFailModal("Hamle sinirina ulastiniz! Sekerleriniz tukendi.");
      return;
    }

    const validShapes = this.activeShapes.filter(s => s !== null);
    if (validShapes.length > 0 && !this.board.hasAnyValidMove(this.activeShapes)) {
      sound.stopBGM();
      sound.playLose();
      this.ui.showFailModal("Tahtada yerlestirilecek yer kalmadi! Kilitlendiniz.");
    }
  }
}

new GameController();
