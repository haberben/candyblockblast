import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Music, Music2, RotateCcw, Volume2, VolumeX, Home } from "lucide-react";

import bgImage from "@/assets/candy-bg.jpg";
import { Candy } from "./Candy";
import { Hud } from "./Hud";
import {
  SIZE,
  canPlaceAnywhere,
  canPlaceAt,
  emptyBoard,
  makeLevel,
  newTray,
  placePiece,
  type Board,
  type CandyId,
  type Piece,
} from "@/lib/game";
import { setMusic, setSfx, sfx, startMusic, stopMusic, unlockAudio } from "@/lib/sfx";

type Fx = { id: number; kind: "sparkle"; x: number; y: number; dx: number; dy: number; candy: CandyId };
type Toast = { id: number; text: string; sub?: string };

let fxSeq = 0;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export function CandyBlockBlast() {
  const [gameMode, setGameMode] = useState<"levels" | "endless" | "timeattack">("levels");
  const [timeAttackLimit, setTimeAttackLimit] = useState(60); // default 60s
  const [timeLeft, setTimeLeft] = useState(60);
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [tray, setTray] = useState<Piece[]>([]);
  const [levelIdx, setLevelIdx] = useState(1);
  const level = useMemo(() => makeLevel(levelIdx), [levelIdx]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(level.moves);
  const [collected, setCollected] = useState(0);
  const [combo, setCombo] = useState(0);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [fx, setFx] = useState<Fx[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [started, setStarted] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // Load level index and check for saved game on load
  useEffect(() => {
    const storedLevel = Number(localStorage.getItem("cbb_level") ?? 1);
    if (storedLevel) setLevelIdx(storedLevel);

    const saved = localStorage.getItem("cbb_saved_game");
    if (saved) {
      setHasSavedGame(true);
    }
  }, []);

  // Sync best score based on current game mode
  useEffect(() => {
    let key = "cbb_best";
    if (gameMode === "endless") {
      key = "cbb_endless_best";
    } else if (gameMode === "timeattack") {
      key = `cbb_timeattack_best_${timeAttackLimit}`;
    }
    const stored = Number(localStorage.getItem(key) ?? 0);
    setBest(stored);
  }, [gameMode, started, timeAttackLimit]);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      let key = "cbb_best";
      if (gameMode === "endless") {
        key = "cbb_endless_best";
      } else if (gameMode === "timeattack") {
        key = `cbb_timeattack_best_${timeAttackLimit}`;
      }
      localStorage.setItem(key, String(score));
    }
  }, [score, best, gameMode, timeAttackLimit]);

  // Time Attack Countdown Timer
  useEffect(() => {
    if (!started || gameMode !== "timeattack" || status !== "playing") return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus("lost");
          sfx.gameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, gameMode, status]);

  // Auto-save game state
  useEffect(() => {
    if (!started || status !== "playing") {
      if (status === "won" || status === "lost") {
        localStorage.removeItem("cbb_saved_game");
      }
      return;
    }
    const stateToSave = {
      board,
      tray,
      score,
      combo,
      moves,
      collected,
      gameMode,
      levelIdx,
      timeLeft,
      timeAttackLimit,
    };
    localStorage.setItem("cbb_saved_game", JSON.stringify(stateToSave));
  }, [started, status, board, tray, score, combo, moves, collected, gameMode, levelIdx, timeLeft, timeAttackLimit]);

  const resumeSavedGame = () => {
    const saved = localStorage.getItem("cbb_saved_game");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setBoard(data.board);
      setTray(data.tray);
      setScore(data.score);
      setCombo(data.combo);
      setMoves(data.moves);
      setCollected(data.collected);
      setGameMode(data.gameMode);
      setLevelIdx(data.levelIdx);
      setTimeLeft(data.timeLeft);
      setTimeAttackLimit(data.timeAttackLimit ?? 60);
      
      unlockAudio();
      if (musicOn) startMusic();
      setStarted(true);
      setHasSavedGame(false);
    } catch (e) {
      console.error("Error loading saved game:", e);
      localStorage.removeItem("cbb_saved_game");
      setHasSavedGame(false);
    }
  };

  const discardSavedGame = () => {
    localStorage.removeItem("cbb_saved_game");
    setHasSavedGame(false);
  };

  // Tray is randomized on the client only (avoids SSR hydration mismatch).
  useEffect(() => {
    setTray((t) => (t.length === 0 ? newTray() : t));
  }, []);


  const boardRef = useRef<HTMLDivElement | null>(null);
  type DragState = {
    piece: Piece;
    slot: number;
    px: number;
    py: number;
    cell: { x: number; y: number } | null;
    valid: boolean;
  };
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const boardRectRef = useRef<{ left: number; top: number } | null>(null);
  const [cellSize, setCellSize] = useState(40);

  useEffect(() => {
    const updateSize = () => {
      const el = boardRef.current;
      if (el) {
        setCellSize(el.getBoundingClientRect().width / SIZE);
      }
    };
    updateSize();
    const t = setTimeout(updateSize, 100);
    window.addEventListener("resize", updateSize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateSize);
    };
  }, []);


  const pushToast = useCallback((text: string, sub?: string) => {
    const id = ++fxSeq;
    setToasts((t) => [...t, { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1100);
  }, []);

  const startLevel = useCallback((idx: number) => {
    const lv = makeLevel(idx);
    setLevelIdx(idx);
    localStorage.setItem("cbb_level", String(idx));
    setBoard(emptyBoard());
    setTray(newTray());
    setMoves(lv.moves);
    setCollected(0);
    setCombo(0);
    setClearing(new Set());
    setStatus("playing");
  }, []);

  const restart = useCallback(() => {
    setScore(0);
    if (gameMode === "levels") {
      startLevel(levelIdx);
    } else if (gameMode === "timeattack") {
      setBoard(emptyBoard());
      setTray(newTray());
      setMoves(9999);
      setCollected(0);
      setCombo(0);
      setClearing(new Set());
      setTimeLeft(timeAttackLimit);
      setStatus("playing");
    } else {
      setBoard(emptyBoard());
      setTray(newTray());
      setMoves(9999);
      setCollected(0);
      setCombo(0);
      setClearing(new Set());
      setStatus("playing");
    }
  }, [gameMode, levelIdx, startLevel, timeAttackLimit]);

  const beginGame = (mode: "levels" | "endless" | "timeattack") => {
    setGameMode(mode);
    unlockAudio();
    if (musicOn) startMusic();

    setScore(0);
    setBoard(emptyBoard());
    setTray(newTray());
    setCombo(0);
    setClearing(new Set());
    setStatus("playing");

    if (mode === "levels") {
      const storedLevel = Number(localStorage.getItem("cbb_level") ?? 1);
      const lv = makeLevel(storedLevel);
      setLevelIdx(storedLevel);
      setMoves(lv.moves);
      setCollected(0);
    } else if (mode === "timeattack") {
      setMoves(9999);
      setCollected(0);
      setTimeLeft(timeAttackLimit);
    } else {
      setMoves(9999);
      setCollected(0);
    }

    setStarted(true);
  };

  const returnToMenu = () => {
    stopMusic();
    setStarted(false);
    setStatus("playing");
  };

  /* ── Drag handling ─────────────────────────────────────────── */
  const cellFromPointer = useCallback((piece: Piece, px: number, py: number) => {
    let r = boardRectRef.current;
    if (!r) {
      const el = boardRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      r = { left: rect.left, top: rect.top };
    }
    const cs = cellSize;
    let gx = Math.round((px - r.left - (piece.shape.w * cs) / 2) / cs);
    let gy = Math.round((py - r.top - cs * 1.6 - (piece.shape.h * cs) / 2) / cs);
    if (gx < -3 || gy < -3 || gx > SIZE + 2 || gy > SIZE + 2) return null;
    // forgiving snap: keep the piece fully inside the grid
    gx = Math.min(Math.max(gx, 0), SIZE - piece.shape.w);
    gy = Math.min(Math.max(gy, 0), SIZE - piece.shape.h);
    return { x: gx, y: gy };
  }, [cellSize]);


  const onPiecePointerDown = (piece: Piece, slot: number) => (e: React.PointerEvent) => {
    if (status !== "playing") return;
    e.preventDefault();
    unlockAudio();
    sfx.pick();
    
    // Cache the board bounds on pointer down to prevent layout thrashing during moves
    const el = boardRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      boardRectRef.current = { left: r.left, top: r.top };
    }

    (e.target as Element).setPointerCapture?.(e.pointerId);
    const d: DragState = { piece, slot, px: e.clientX, py: e.clientY, cell: null, valid: false };
    dragRef.current = d;
    setDrag(d);
  };

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      
      if (floatingRef.current) {
        floatingRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY - cellSize * 1.6}px, 0) translate(-50%, -50%)`;
      }

      const currentDrag = dragRef.current;
      if (!currentDrag) return;
      
      const cell = cellFromPointer(currentDrag.piece, e.clientX, e.clientY);
      const valid = cell ? canPlaceAt(board, currentDrag.piece, cell.x, cell.y) : false;
      
      currentDrag.px = e.clientX;
      currentDrag.py = e.clientY;
      
      const cellChanged = cell?.x !== currentDrag.cell?.x || cell?.y !== currentDrag.cell?.y;
      const validityChanged = valid !== currentDrag.valid;
      
      if (cellChanged || validityChanged) {
        currentDrag.cell = cell;
        currentDrag.valid = valid;
        
        setDrag((d) => {
          if (!d) return d;
          return { ...d, cell, valid };
        });
      }
    };
    const up = () => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (d) commit(d);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null, board, cellFromPointer, cellSize]);

  const spawnSparkles = (indices: number[], b: Board) => {
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cs = r.width / SIZE;
    const parts: Fx[] = [];
    indices.slice(0, 26).forEach((i) => {
      const cx = (i % SIZE) * cs + cs / 2;
      const cy = Math.floor(i / SIZE) * cs + cs / 2;
      const candy = (b[i] ?? 0) as CandyId;
      for (let k = 0; k < 3; k++) {
        parts.push({
          id: ++fxSeq,
          kind: "sparkle",
          x: cx,
          y: cy,
          dx: (Math.random() - 0.5) * 120,
          dy: (Math.random() - 0.5) * 120,
          candy,
        });
      }
    });
    setFx((f) => [...f, ...parts]);
    setTimeout(() => setFx((f) => f.filter((p) => !parts.includes(p))), 750);
  };

  const commit = (d: NonNullable<typeof drag>) => {
    if (!d.cell || !canPlaceAt(board, d.piece, d.cell.x, d.cell.y)) {
      sfx.invalid();
      return;
    }
    const res = placePiece(board, d.piece, d.cell.x, d.cell.y, combo);
    sfx.place();

    const boardWithPiece = board.slice();
    d.piece.shape.cells.forEach(([x, y]) => {
      boardWithPiece[(d.cell!.y + y) * SIZE + (d.cell!.x + x)] = d.piece.candy;
    });

    const nextCombo = res.lines > 0 ? combo + 1 : 0;
    setCombo(nextCombo);
    setScore((s) => s + res.gained);
    setCollected((c) => c + (res.collected[level.targetCandy] ?? 0));

    // remaining tray
    const restTray = tray.filter((_, i) => i !== d.slot);
    const nextTray = restTray.length === 0 ? newTray() : restTray;

    if (res.lines > 0) {
      sfx.blast(res.lines, nextCombo);
      setBoard(boardWithPiece);
      setClearing(new Set(res.clearedIndices));
      spawnSparkles(res.clearedIndices, boardWithPiece);
      if (res.lines >= 2 || nextCombo >= 2) {
        sfx.combo(nextCombo);
        pushToast(
          nextCombo >= 2 ? `${nextCombo}X COMBO!` : "CANDY BLAST!",
          `+${res.gained.toLocaleString("tr-TR")}`,
        );
      } else {
        pushToast("BLAST!", `+${res.gained.toLocaleString("tr-TR")}`);
      }
      setTimeout(() => {
        setClearing(new Set());
        setBoard(res.board);
        finishMove(res.board, nextTray, res.collected[level.targetCandy] ?? 0);
      }, 380);
    } else {
      setBoard(res.board);
      finishMove(res.board, nextTray, 0);
    }
    setTray(nextTray);
  };

  const finishMove = (nextBoard: Board, nextTray: Piece[], gainedTarget: number) => {
    if (gameMode === "endless") {
      const stuck = !nextTray.some((p) => canPlaceAnywhere(nextBoard, p));
      if (stuck) {
        sfx.gameOver();
        setStatus("lost");
      }
    } else {
      setMoves((m) => {
        const left = m - 1;
        const totalCollected = collected + gainedTarget;
        if (totalCollected >= level.targetCount) {
          sfx.levelUp();
          setStatus("won");
          return left;
        }
        const stuck = !nextTray.some((p) => canPlaceAnywhere(nextBoard, p));
        if (left <= 0 || stuck) {
          sfx.gameOver();
          setStatus("lost");
        }
        return left;
      });
    }
  };

  const cellSizePx = useCallback(() => {
    return cellSize;
  }, [cellSize]);

  const ghostCells = useMemo(() => {
    if (!drag?.cell) return new Set<number>();
    const s = new Set<number>();
    drag.piece.shape.cells.forEach(([x, y]) => {
      const cx = drag.cell!.x + x;
      const cy = drag.cell!.y + y;
      if (cx >= 0 && cy >= 0 && cx < SIZE && cy < SIZE) s.add(cy * SIZE + cx);
    });
    return s;
  }, [drag]);

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center overflow-hidden animate-fade-in touch-none select-none"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-sky/10" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3 pb-5">
        <Hud
          score={score}
          targetCandy={level.targetCandy}
          collected={collected}
          targetCount={level.targetCount}
          moves={moves}
          level={levelIdx}
          gameMode={gameMode}
          best={best}
          combo={combo}
          timeLeft={timeLeft}
          timeLimit={timeAttackLimit}
        />

        <div className="mt-2 flex items-center justify-between">
          <div
            className="rounded-2xl px-3 py-1.5 font-display text-xs font-extrabold text-panel-foreground"
            style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
          >
            EN İYİ: {best.toLocaleString("tr-TR")}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSoundOn((v) => {
                  setSfx(!v);
                  return !v;
                });
              }}
              aria-label="Ses efektleri"
              className="flex size-9 items-center justify-center rounded-full text-base cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
            >
              {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setMusicOn((v) => {
                  setMusic(!v);
                  return !v;
                });
              }}
              aria-label="Müzik"
              className="flex size-9 items-center justify-center rounded-full text-base cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
            >
              {musicOn ? <Music className="size-5" /> : <Music2 className="size-5 opacity-50" />}
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label="Yeniden başla"
              className="flex size-9 items-center justify-center rounded-full text-base cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
            >
              <RotateCcw className="size-5" />
            </button>
            <button
              type="button"
              onClick={returnToMenu}
              aria-label="Menüye Dön"
              className="flex size-9 items-center justify-center rounded-full text-base cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
            >
              <Home className="size-5" />
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="relative">
          <div
            ref={boardRef}
            className="relative grid aspect-square w-full grid-cols-8 gap-[3px] rounded-3xl bg-boardbg p-[6px]"
            style={{ boxShadow: "0 8px 0 oklch(0.3 0.06 265 / 0.6), 0 16px 32px oklch(0.2 0.05 280 / 0.4)" }}
          >
            {board.map((cell, i) => {
              const isGhost = ghostCells.has(i);
              const isClearing = clearing.has(i);
              return (
                <div
                  key={i}
                  className="relative rounded-[22%] bg-boardcell/70"
                  style={
                    isGhost
                      ? {
                          outline: `2px solid ${drag?.valid ? "var(--gold)" : "var(--destructive)"}`,
                          outlineOffset: "-1px",
                        }
                      : undefined
                  }
                >
                  {cell !== null && (
                    <Candy
                      id={cell}
                      className={`absolute inset-[6%] ${isClearing ? "anim-blast" : "anim-pop"}`}
                    />
                  )}
                  {cell === null && isGhost && drag && (
                    <Candy id={drag.piece.candy} className="absolute inset-[10%] opacity-40" />
                  )}
                </div>
              );
            })}

            {/* sparkle particles */}
            <div className="pointer-events-none absolute inset-0 overflow-visible">
              {fx.map((p) => (
                <span
                  key={p.id}
                  className="anim-sparkle absolute size-2 rounded-full"
                  style={
                    {
                      left: p.x,
                      top: p.y,
                      "--dx": `${p.dx}px`,
                      "--dy": `${p.dy}px`,
                      background: `var(--candy-${p.candy}b)`,
                      boxShadow: `0 0 8px var(--candy-${p.candy})`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            {/* combo toasts */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
              {toasts.map((t) => (
                <div key={t.id} className="anim-combo text-center">
                  <div
                    className="font-display text-5xl font-extrabold text-outline"
                    style={{ color: "var(--gold)" }}
                  >
                    {t.text}
                  </div>
                  {t.sub && (
                    <div className="font-display text-xl font-extrabold text-outline text-primary-foreground">
                      {t.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tray */}
        <div
          className="mt-1 grid grid-cols-3 items-center gap-2 rounded-3xl bg-boardbg p-3 h-24"
          style={{ boxShadow: "0 6px 0 oklch(0.3 0.06 265 / 0.5)" }}
        >
          {[0, 1, 2].map((slot) => {
            const piece = tray[slot];
            if (!piece) return <div key={slot} className="h-full" />;
            const dragging = drag?.slot === slot;
            const placeable = canPlaceAnywhere(board, piece);
            
            // Calculate dynamic unit sizes to prevent large shapes from overflowing the tray box
            const maxDim = Math.max(piece.shape.w, piece.shape.h);
            const unit = maxDim >= 5 ? 13 : maxDim >= 4 ? 17 : maxDim >= 3 ? 22 : 26;

            return (
              <div
                key={piece.uid}
                onPointerDown={onPiecePointerDown(piece, slot)}
                className={`flex h-full cursor-grab touch-none items-center justify-center rounded-2xl transition-all ${
                  dragging ? "opacity-25" : placeable ? "anim-wobble opacity-100" : "opacity-40"
                }`}
              >
                <div
                  className="relative"
                  style={{ width: piece.shape.w * unit, height: piece.shape.h * unit }}
                >
                  {piece.shape.cells.map(([x, y]) => (
                    <Candy
                      key={`${x}-${y}`}
                      id={piece.candy}
                      className="absolute pointer-events-none"
                      style={{ left: x * unit, top: y * unit, width: unit - 2, height: unit - 2 }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center font-display text-xs font-bold text-panel-foreground/80">
          Blokları sürükleyip ızgaraya bırak · Satır ya da sütunu doldur, patlat!
        </p>
      </div>

      {/* Floating dragged piece */}
      {drag && (
        <div
          ref={floatingRef}
          className="pointer-events-none fixed z-50"
          style={{
            left: 0,
            top: 0,
            transform: `translate3d(${drag.px}px, ${drag.py - cellSizePx() * 1.6}px, 0) translate(-50%, -50%)`,
            willChange: "transform",
          }}
        >
          <div
            className="relative"
            style={{
              width: drag.piece.shape.w * cellSizePx(),
              height: drag.piece.shape.h * cellSizePx(),
            }}
          >
            {drag.piece.shape.cells.map(([x, y]) => (
              <Candy
                key={`${x}-${y}`}
                id={drag.piece.candy}
                className="absolute"
                style={{
                  left: x * cellSizePx(),
                  top: y * cellSizePx(),
                  width: cellSizePx() - 3,
                  height: cellSizePx() - 3,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overlays */}
      {!started && hasSavedGame ? (
        <Overlay>
          <Title />
          <div className="font-display text-xl font-black text-panel-foreground text-center mt-4">
            YARIM KALAN OYUN VAR!
          </div>
          <p className="mt-3 max-w-xs text-center font-display text-sm font-bold text-panel-foreground/80 leading-normal">
            Kapatmadan önce yarım kalan bir oyunun olduğunu fark ettik. Kaldığın yerden devam etmek ister misin?
          </p>
          
          <div className="flex flex-col w-full gap-3 mt-6">
            <BigButton onClick={resumeSavedGame}>
              DEVAM ET
            </BigButton>
            <button 
              onClick={discardSavedGame}
              className="mt-3 text-panel-foreground/80 font-display text-sm font-extrabold hover:text-panel-foreground cursor-pointer"
            >
              Yeni Oyun Başlat (Kaydı Sil)
            </button>
          </div>
        </Overlay>
      ) : !started && (
        <Overlay>
          <Title />
          <p className="mt-3 max-w-xs text-center font-display text-sm font-bold text-panel-foreground leading-normal">
            Şeker bloklarını ızgaraya yerleştir, satırları patlat, en yüksek skora ulaş!
          </p>
          
          <div className="flex flex-col w-full gap-3 mt-5">
            <BigButton onClick={() => beginGame("levels")}>
              SEVİYELİ MOD (Seviye {levelIdx})
            </BigButton>
            <BigButton onClick={() => beginGame("endless")}>
              SINIRSIZ MOD
            </BigButton>
            
            <div className="flex flex-col w-full gap-2 rounded-2xl p-2 border border-panel-foreground/10 bg-black/10">
              <BigButton onClick={() => beginGame("timeattack")} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                ZAMANA KARŞI MODU
              </BigButton>
              
              <div className="flex items-center justify-between px-3 py-1 text-panel-foreground font-display font-extrabold text-sm">
                <span>Süre Ayarı:</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setTimeAttackLimit(prev => Math.max(30, prev - 30))}
                    className="size-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 text-xl font-bold cursor-pointer select-none text-panel-foreground"
                  >
                    -
                  </button>
                  <span className="text-base tracking-wider min-w-[3.5rem] text-center" style={{ color: "var(--gold)" }}>
                    {formatTime(timeAttackLimit)}
                  </span>
                  <button 
                    onClick={() => setTimeAttackLimit(prev => Math.min(300, prev + 30))}
                    className="size-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 text-xl font-bold cursor-pointer select-none text-panel-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {status === "won" && (
        <Overlay>
          <div className="font-display text-4xl font-extrabold text-outline" style={{ color: "var(--gold)" }}>
            SEVİYE {levelIdx} TAMAM!
          </div>
          <p className="mt-2 font-display text-lg font-extrabold text-panel-foreground">
            Puan: {score.toLocaleString("tr-TR")}
          </p>
          <BigButton onClick={() => startLevel(levelIdx + 1)}>SONRAKİ SEVİYE</BigButton>
          <button 
            onClick={returnToMenu}
            className="mt-3 text-panel-foreground/80 font-display text-sm font-extrabold hover:text-panel-foreground cursor-pointer"
          >
            Menüye Dön
          </button>
        </Overlay>
      )}

      {status === "lost" && (
        <Overlay>
          <div className="font-display text-4xl font-extrabold text-outline" style={{ color: "var(--gold)" }}>
            {gameMode === "timeattack" && timeLeft === 0 ? "SÜRE BİTTİ!" : "OYUN BİTTİ"}
          </div>
          <p className="mt-2 font-display text-lg font-extrabold text-panel-foreground text-center">
            {gameMode === "timeattack" && timeLeft === 0 ? (
              <span>Zamana Karşı ({formatTime(timeAttackLimit)}) skoru</span>
            ) : (
              <span>Skorunuz</span>
            )}
            <br />
            Puan: {score.toLocaleString("tr-TR")} · Rekor: {best.toLocaleString("tr-TR")}
          </p>
          <BigButton onClick={restart}>TEKRAR DENE</BigButton>
          <button 
            onClick={returnToMenu}
            className="mt-3 text-panel-foreground/80 font-display text-sm font-extrabold hover:text-panel-foreground cursor-pointer"
          >
            Menüye Dön
          </button>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-foreground/45 px-6 backdrop-blur-sm animate-fade-in">
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-[2rem] p-6 transition-all"
        style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-panel)" }}
      >
        {children}
      </div>
    </div>
  );
}

const Title = React.memo(function Title() {
  return (
    <h1 className="text-center font-display text-5xl leading-none font-extrabold">
      <span className="text-outline block" style={{ color: "var(--candy-5)" }}>
        CANDY
      </span>
      <span className="text-outline block" style={{ color: "var(--gold)" }}>
        BLOCK BLAST!
      </span>
    </h1>
  );
});

function BigButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-6 py-3 font-display text-lg font-extrabold text-accent-foreground transition-transform hover:scale-102 active:scale-98 cursor-pointer"
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-candy)" }}
    >
      {children}
    </button>
  );
}

export default CandyBlockBlast;
