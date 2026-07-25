
export const CANDY_TYPES = {
  lollipop: 'lollipop',
  blue_wrapped: 'blue_wrapped',
  red_jelly: 'red_jelly',
  lemon_slice: 'lemon_slice',
  green_jelly: 'green_jelly',
  orange_wrap: 'orange_wrap',
  peppermint: 'peppermint',
  purple_drop: 'purple_drop'
};

export const CANDY_SVGS = {
  lollipop: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <rect x="27" y="30" width="6" height="25" rx="3" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <circle cx="30" cy="25" r="18" fill="url(#lollipopGrad)"/>
    <path d="M 30 25 A 6 6 0 0 1 36 31 A 12 12 0 0 1 24 37 A 18 18 0 0 1 12 25" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <defs>
      <radialGradient id="lollipopGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ff7eb9" />
        <stop offset="70%" stop-color="#ff1a8c" />
        <stop offset="100%" stop-color="#cc005f" />
      </radialGradient>
    </defs>
  </svg>`,
  blue_wrapped: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <polygon points="12,30 2,20 2,40" fill="#00bfff" stroke="#0080ff" stroke-width="1.5"/>
    <polygon points="48,30 58,20 58,40" fill="#00bfff" stroke="#0080ff" stroke-width="1.5"/>
    <ellipse cx="30" cy="30" rx="18" ry="14" fill="url(#blueGrad)" stroke="#0080ff" stroke-width="1"/>
    <path d="M 20 20 Q 30 25 40 20 M 18 30 Q 30 35 42 30 M 20 40 Q 30 45 40 40" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <defs>
      <radialGradient id="blueGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#8ce6ff" />
        <stop offset="70%" stop-color="#00a2ff" />
        <stop offset="100%" stop-color="#0066cc" />
      </radialGradient>
    </defs>
  </svg>`,
  red_jelly: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <path d="M 18,25 C 18,15 42,15 42,25 C 42,32 36,35 30,35 C 24,35 18,32 18,25 Z" fill="url(#redGrad)" transform="rotate(-15, 30, 30)"/>
    <ellipse cx="26" cy="22" rx="4" ry="2" fill="#ffffff" opacity="0.8" transform="rotate(-15, 30, 30)"/>
    <defs>
      <radialGradient id="redGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ff6b6b" />
        <stop offset="70%" stop-color="#e60000" />
        <stop offset="100%" stop-color="#990099" />
      </radialGradient>
    </defs>
  </svg>`,
  lemon_slice: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <circle cx="30" cy="30" r="18" fill="url(#yellowGrad)" stroke="#e6b800" stroke-width="1"/>
    <circle cx="30" cy="30" r="15" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4,2"/>
    <line x1="30" y1="12" x2="30" y2="48" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="12" y1="30" x2="48" y2="30" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="17.3" y1="17.3" x2="42.7" y2="42.7" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="17.3" y1="42.7" x2="42.7" y2="17.3" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="3" fill="#ffea00"/>
    <defs>
      <radialGradient id="yellowGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffea3b" />
        <stop offset="70%" stop-color="#ffcc00" />
        <stop offset="100%" stop-color="#b38f00" />
      </radialGradient>
    </defs>
  </svg>`,
  green_jelly: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <rect x="14" y="14" width="32" height="32" rx="8" fill="url(#greenGrad)" stroke="#009933" stroke-width="1"/>
    <path d="M 18 20 A 4 4 0 0 1 24 16 L 36 16" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    <circle cx="20" cy="22" r="2" fill="#ffffff" opacity="0.8"/>
    <defs>
      <radialGradient id="greenGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#66ff66" />
        <stop offset="70%" stop-color="#00cc44" />
        <stop offset="100%" stop-color="#006622" />
      </radialGradient>
    </defs>
  </svg>`,
  orange_wrap: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <polygon points="12,30 2,18 2,42" fill="#ff7f00" stroke="#cc5200" stroke-width="1"/>
    <polygon points="48,30 58,18 58,42" fill="#ff7f00" stroke="#cc5200" stroke-width="1"/>
    <circle cx="30" cy="30" r="16" fill="url(#orangeGrad)" stroke="#cc5200" stroke-width="1"/>
    <path d="M 30 14 C 20 22 20 38 30 46" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/>
    <circle cx="36" cy="24" r="2.5" fill="#ffffff" opacity="0.8"/>
    <defs>
      <radialGradient id="orangeGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffa64d" />
        <stop offset="70%" stop-color="#ff7300" />
        <stop offset="100%" stop-color="#b35100" />
      </radialGradient>
    </defs>
  </svg>`,
  peppermint: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <circle cx="30" cy="30" r="18" fill="#ffffff" stroke="#cc0000" stroke-width="1"/>
    <g fill="#e60000">
      <path d="M 30 30 L 30 12 A 18 18 0 0 1 42.7 17.3 Z"/>
      <path d="M 30 30 L 48 30 A 18 18 0 0 1 42.7 42.7 Z" transform="rotate(45, 30, 30)"/>
      <path d="M 30 30 L 30 48 A 18 18 0 0 1 17.3 42.7 Z" transform="rotate(90, 30, 30)"/>
      <path d="M 30 30 L 12 30 A 18 18 0 0 1 17.3 17.3 Z" transform="rotate(135, 30, 30)"/>
      <path d="M 30 30 L 30 12 A 18 18 0 0 1 42.7 17.3 Z" transform="rotate(180, 30, 30)"/>
      <path d="M 30 30 L 48 30 A 18 18 0 0 1 42.7 42.7 Z" transform="rotate(225, 30, 30)"/>
      <path d="M 30 30 L 30 48 A 18 18 0 0 1 17.3 42.7 Z" transform="rotate(270, 30, 30)"/>
      <path d="M 30 30 L 12 30 A 18 18 0 0 1 17.3 17.3 Z" transform="rotate(315, 30, 30)"/>
    </g>
    <circle cx="30" cy="30" r="6" fill="#ffffff" stroke="#cc0000" stroke-width="0.5"/>
    <circle cx="30" cy="30" r="3" fill="#e60000"/>
  </svg>`,
  purple_drop: `<svg viewBox="0 0 60 60" width="100%" height="100%">
    <path d="M 30,12 C 30,12 44,28 44,36 C 44,44 38,48 30,48 C 22,48 16,44 16,36 C 16,28 30,12 30,12 Z" fill="url(#purpleGrad)" stroke="#7a0099" stroke-width="1"/>
    <ellipse cx="26" cy="32" rx="4" ry="2" fill="#ffffff" opacity="0.8" transform="rotate(-15, 26, 32)"/>
    <defs>
      <radialGradient id="purpleGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#e600e6" />
        <stop offset="70%" stop-color="#990099" />
        <stop offset="100%" stop-color="#4d004d" />
      </radialGradient>
    </defs>
  </svg>`
};

export const LEVELS = [
  {
    id: 1,
    name: "Tatli Baslangic",
    moves: 20,
    target: {
      type: CANDY_TYPES.lollipop,
      amount: 15,
      label: "Lolipop"
    },
    difficulty: "Kolay",
    colorsCount: 4
  },
  {
    id: 2,
    name: "Mavi Paketler",
    moves: 22,
    target: {
      type: CANDY_TYPES.blue_wrapped,
      amount: 20,
      label: "Mavi Seker"
    },
    difficulty: "Orta",
    colorsCount: 5
  },
  {
    id: 3,
    name: "Nane Sekeri Firtinasi",
    moves: 25,
    target: {
      type: CANDY_TYPES.peppermint,
      amount: 25,
      label: "Nane Sekeri"
    },
    difficulty: "Orta",
    colorsCount: 6
  },
  {
    id: 4,
    name: "Limon Bahcesi",
    moves: 28,
    target: {
      type: CANDY_TYPES.lemon_slice,
      amount: 30,
      label: "Limon Sekeri"
    },
    difficulty: "Zor",
    colorsCount: 7
  },
  {
    id: 5,
    name: "Buyuk Seker Fabrikasi",
    moves: 30,
    target: {
      type: CANDY_TYPES.purple_drop,
      amount: 35,
      label: "Mor Damla"
    },
    difficulty: "Uzman",
    colorsCount: 8
  }
];

export function getLevelsState() {
  const defaultState = {
    unlockedLevel: 1,
    highScores: {}
  };
  const stored = localStorage.getItem('candy_block_blast_state');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch(e) {
      return defaultState;
    }
  }
  return defaultState;
}

export function saveLevelProgress(levelId, score, completed) {
  const state = getLevelsState();
  if (completed && levelId === state.unlockedLevel && levelId < LEVELS.length) {
    state.unlockedLevel = levelId + 1;
  }
  if (!state.highScores[levelId] || score > state.highScores[levelId]) {
    state.highScores[levelId] = score;
  }
  localStorage.setItem('candy_block_blast_state', JSON.stringify(state));
}
