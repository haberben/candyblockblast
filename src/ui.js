
import { LEVELS, getLevelsState, CANDY_SVGS } from './levels';

export class GameUI {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.setupDOMElements();
    this.bindEvents();
  }

  setupDOMElements() {
    this.screens = {
      map: document.getElementById('map-screen'),
      game: document.getElementById('game-screen')
    };
    this.mapLevelsGrid = document.getElementById('levels-grid');
    this.scoreVal = document.getElementById('score-value');
    this.movesVal = document.getElementById('moves-value');
    this.targetVal = document.getElementById('target-value');
    this.targetIcon = document.getElementById('target-icon-box');
    this.targetLabel = document.getElementById('target-label');
    this.comboIndicator = document.getElementById('combo-indicator');
    this.comboText = document.getElementById('combo-text');
    this.modals = {
      win: document.getElementById('win-modal'),
      fail: document.getElementById('fail-modal')
    };
    this.winScore = document.getElementById('win-score-val');
    this.failReason = document.getElementById('fail-reason-text');
  }

  bindEvents() {
    document.getElementById('mute-btn').addEventListener('click', () => {
      const isMuted = this.callbacks.onToggleMute();
      const icon = document.querySelector('#mute-btn i') || document.querySelector('#mute-btn');
      icon.innerHTML = isMuted ? '🔇' : '🔊';
    });

    document.getElementById('map-btn').addEventListener('click', () => {
      this.callbacks.onGoToMap();
    });

    document.getElementById('trophy-btn').addEventListener('click', () => {
      if (confirm('Seviye ilerlemenizi sıfırlamak istiyor musunuz?')) {
        localStorage.removeItem('candy_block_blast_state');
        this.renderLevelsMap();
      }
    });

    document.getElementById('win-next-btn').addEventListener('click', () => {
      this.hideModals();
      this.callbacks.onNextLevel();
    });

    document.getElementById('win-map-btn').addEventListener('click', () => {
      this.hideModals();
      this.callbacks.onGoToMap();
    });

    document.getElementById('fail-retry-btn').addEventListener('click', () => {
      this.hideModals();
      this.callbacks.onRetryLevel();
    });

    document.getElementById('fail-map-btn').addEventListener('click', () => {
      this.hideModals();
      this.callbacks.onGoToMap();
    });
  }

  renderLevelsMap() {
    this.mapLevelsGrid.innerHTML = '';
    const state = getLevelsState();

    LEVELS.forEach(lvl => {
      const btn = document.createElement('button');
      btn.className = 'level-card';
      const isUnlocked = lvl.id <= state.unlockedLevel;

      if (!isUnlocked) {
        btn.classList.add('locked');
      }

      const highScore = state.highScores[lvl.id] || 0;
      btn.innerHTML = `
        <div class="level-num">${lvl.id}</div>
        <div class="level-name">${lvl.name}</div>
        <div class="level-target-preview">
          ${CANDY_SVGS[lvl.target.type]}
          <span>${lvl.target.amount} ${lvl.target.label}</span>
        </div>
        <div class="level-score">${highScore > 0 ? 'En Yuksek: ' + highScore.toLocaleString() : 'Oynanmadi'}</div>
        <div class="level-difficulty ${lvl.difficulty.toLowerCase()}">${lvl.difficulty}</div>
      `;

      if (isUnlocked) {
        btn.addEventListener('click', () => {
          this.callbacks.onStartLevel(lvl.id);
        });
      }

      this.mapLevelsGrid.appendChild(btn);
    });
  }

  showScreen(screenName) {
    Object.keys(this.screens).forEach(name => {
      if (name === screenName) {
        this.screens[name].classList.add('active');
      } else {
        this.screens[name].classList.remove('active');
      }
    });
  }

  updateStats(score, moves, targetCollected, targetAmount, targetType, targetLabel) {
    this.scoreVal.textContent = score.toLocaleString();
    this.movesVal.textContent = moves;
    
    const remaining = Math.max(0, targetAmount - targetCollected);
    this.targetVal.textContent = remaining;
    this.targetIcon.innerHTML = CANDY_SVGS[targetType];
    this.targetLabel.textContent = targetLabel;

    this.targetIcon.classList.remove('pulse');
    void this.targetIcon.offsetWidth;
    this.targetIcon.classList.add('pulse');
  }

  showCombo(count) {
    if (count <= 1) return;
    this.comboIndicator.classList.remove('show');
    void this.comboIndicator.offsetWidth;
    this.comboText.textContent = `${count}x COMBO!`;
    this.comboIndicator.classList.add('show');
  }

  showWinModal(score) {
    this.winScore.textContent = score.toLocaleString();
    this.modals.win.classList.add('active');
  }

  showFailModal(reason) {
    this.failReason.textContent = reason;
    this.modals.fail.classList.add('active');
  }

  hideModals() {
    this.modals.win.classList.remove('active');
    this.modals.fail.classList.remove('active');
  }
}
