import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Music, Music2, Home, RotateCcw, Volume2, VolumeX } from "lucide-react";

import bgImage from "@/assets/candy-bg.jpg";
import { Candy } from "./Candy";
import { Hud } from "./Hud";
import {
  SIZE,
  POWERS,
  applyPower,
  canPlaceAnywhere,
  canPlaceAt,
  emptyBoard,
  makeLevel,
  newTray,
  placePiece,
  powersEarned,
  type Board,
  type CandyId,
  type Piece,
  type PowerKind,
} from "@/lib/game";
import { MODES, TIME_OPTIONS, readBest, writeBest, type Mode } from "@/lib/modes";
import { THEMES, THEME_KEY, getTheme, type ThemeId } from "@/lib/themes";
import { setMusic, setSfx, sfx, startMusic, stopMusic, unlockAudio } from "@/lib/sfx";

type Fx = { id: number; x: number; y: number; dx: number; dy: number; candy: CandyId };
type Toast = { id: number; text: string; sub?: string };

type DragCore = {
  piece: Piece;
  slot: number;
  cellSize: number;
  offX: number;
  offY: number;
};
type DragView = { piece: Piece; slot: number; cell: { x: number; y: number } | null; valid: boolean };

const getActiveOffY = (core: DragCore, py: number, r: DOMRect) => {
  const maxOffY = core.piece.shape.h * core.cellSize + 175; // 3.5x dikey ofset (parmağın üstünde)
  const minOffY = (core.piece.shape.h * core.cellSize) / 2; // Parmağın altına hizalanma (tepside)
  const ratio = Math.min(1, Math.max(0, (py - r.bottom) / 80));
  return maxOffY - ratio * (maxOffY - minOffY);
};

let fxSeq = 0;

export function CandyBlockBlast() {
  const [themeId, setThemeId] = useState<ThemeId>("candy");
  const theme = getTheme(themeId);

  const [mode, setMode] = useState<Mode>("time");
  const [seconds, setSeconds] = useState(60);

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [tray, setTray] = useState<Piece[]>([]);
  const [levelIdx, setLevelIdx] = useState(1);
  const level = useMemo(() => makeLevel(levelIdx), [levelIdx]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(level.moves);
  const [collected, setCollected] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [fx, setFx] = useState<Fx[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [powers, setPowers] = useState<PowerKind[]>([]);
  const [armed, setArmed] = useState<PowerKind | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const floatRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const coreRef = useRef<DragCore | null>(null);
  const viewRef = useRef<DragView | null>(null);
  const boardStateRef = useRef<Board>(board);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const [dragView, setDragView] = useState<DragView | null>(null);

  boardStateRef.current = board;

  /* ── Persisted prefs (offline) ─────────────────────────────────── */
  useEffect(() => {
    const t = localStorage.getItem(THEME_KEY) as ThemeId | null;
    if (t && THEMES.some((x) => x.id === t)) setThemeId(t);
    const m = localStorage.getItem("cbb_mode") as Mode | null;
    if (m && MODES.some((x) => x.id === m)) setMode(m);
    const s = Number(localStorage.getItem("cbb_seconds") ?? 60);
    if (TIME_OPTIONS.includes(s)) setSeconds(s);
    setTray((prev) => (prev.length === 0 ? newTray() : prev));
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeId);
  }, [themeId]);
  useEffect(() => {
    localStorage.setItem("cbb_mode", mode);
    localStorage.setItem("cbb_seconds", String(seconds));
    setBest(readBest(mode, seconds));
  }, [mode, seconds]);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      writeBest(mode, seconds, score);
    }
  }, [score, best, mode, seconds]);

  /* ── Timer (time attack) ───────────────────────────────────────── */
  useEffect(() => {
    if (screen !== "game" || mode !== "time" || status !== "playing") return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          sfx.gameOver();
          setStatus("lost");
          return 0;
        }
        if (t <= 6) sfx.tick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [screen, mode, status]);

  const pushToast = useCallback((text: string, sub?: string) => {
    const id = ++fxSeq;
    setToasts((t) => [...t, { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1100);
  }, []);

  const startRound = useCallback(
    (m: Mode, secs: number, idx = 1, keepScore = false) => {
      const lv = makeLevel(idx);
      setLevelIdx(idx);
      setBoard(emptyBoard());
      setTray(newTray());
      setMoves(lv.moves);
      setCollected(0);
      setCombo(0);
      setTimeLeft(secs);
      setClearing(new Set());
      setStatus("playing");
      setPowers([]);
      setArmed(null);
      if (!keepScore) setScore(0);
    },
    [],
  );

  const beginGame = () => {
    unlockAudio();
    if (musicOn) startMusic();
    setBest(readBest(mode, seconds));
    startRound(mode, seconds);
    setScreen("game");
  };

  const backToMenu = () => {
    setScreen("menu");
    setStatus("playing");
  };

  /* ── Drag handling (rAF, transform-only for 60fps) ─────────────── */
  const computeCell = (core: DragCore, px: number, py: number) => {
    const r = rectRef.current;
    if (!r) return null;
    const cs = core.cellSize;

    // Parmak tepsinin ortasından aşağıya indiğinde yerleşimi iptal et (tahtaya snap olmasın)
    if (py > r.bottom + 65 || py < r.top - 120) return null;

    const activeOffY = getActiveOffY(core, py, r);
    const gx = Math.round((px - core.offX - (r.left + 6)) / cs);
    const gy = Math.round((py - activeOffY - (r.top + 6)) / cs);

    // Block Blast davranışı: tamamen tahtaya sığmıyorsa hedef yok (snap yok)
    if (gx < 0 || gy < 0 || gx + core.piece.shape.w > SIZE || gy + core.piece.shape.h > SIZE)
      return null;
    return { x: gx, y: gy };
  };

  const flush = () => {
    rafRef.current = null;
    const core = coreRef.current;
    const p = pendingRef.current;
    if (!core || !p) return;
    const cell = computeCell(core, p.x, p.y);
    const valid = cell ? canPlaceAt(boardStateRef.current, core.piece, cell.x, cell.y) : false;
    if (floatRef.current) {
      const r = rectRef.current;
      const activeOffY = r ? getActiveOffY(core, p.y, r) : core.offY;
      // sadece geçerli hedefte hücreye otur; dolu/dışarıda ise parmağı takip et
      const tx = valid && cell && r ? r.left + 6 + cell.x * core.cellSize : p.x - core.offX;
      const ty = valid && cell && r ? r.top + 6 + cell.y * core.cellSize : p.y - activeOffY;
      floatRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      floatRef.current.style.opacity = valid ? "1" : "0.85";
    }
    const prev = viewRef.current;
    const nextCell = valid ? cell : null;
    if (!prev || prev.valid !== valid || prev.cell?.x !== nextCell?.x || prev.cell?.y !== nextCell?.y) {
      const next = { piece: core.piece, slot: core.slot, cell: nextCell, valid };
      viewRef.current = next;
      setDragView(next);
    }
  };

  const onPiecePointerDown = (piece: Piece, slot: number) => (e: React.PointerEvent) => {
    if (status !== "playing" || coreRef.current) return;
    e.preventDefault();
    unlockAudio();
    sfx.pick();
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rectRef.current = r;
    const cs = (r.width - 9) / SIZE;
    const core: DragCore = {
      piece,
      slot,
      cellSize: cs,
      offX: (piece.shape.w * cs) / 2,
      offY: piece.shape.h * cs + 150,
    };
    coreRef.current = core;
    const view = { piece, slot, cell: null, valid: false };
    viewRef.current = view;
    setDragView(view);
    pendingRef.current = { x: e.clientX, y: e.clientY };
    flush();
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!coreRef.current) return;
      e.preventDefault();
      pendingRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(flush);
    };
    const up = () => {
      const core = coreRef.current;
      const view = viewRef.current;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      coreRef.current = null;
      viewRef.current = null;
      setDragView(null);
      if (core && view) commitRef.current(core, view);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useLayoutEffect(() => {
    if (dragView && floatRef.current && pendingRef.current && coreRef.current) {
      const p = pendingRef.current;
      const c = coreRef.current;
      const r = rectRef.current;
      const cell = dragView.valid ? dragView.cell : null;
      const activeOffY = r ? getActiveOffY(c, p.y, r) : c.offY;
      const tx = cell && r ? r.left + 6 + cell.x * c.cellSize : p.x - c.offX;
      const ty = cell && r ? r.top + 6 + cell.y * c.cellSize : p.y - activeOffY;
      floatRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      floatRef.current.style.opacity = dragView.valid ? "1" : "0.85";
    }
  }, [dragView]);

  const spawnSparkles = (indices: number[], b: Board) => {
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cs = r.width / SIZE;
    const lowEnd =
      typeof navigator !== "undefined" &&
      ((navigator.hardwareConcurrency ?? 4) <= 4 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const perCell = lowEnd ? 1 : 2;
    const maxCells = lowEnd ? 8 : 20;
    const parts: Fx[] = [];
    indices.slice(0, maxCells).forEach((i) => {
      const cx = (i % SIZE) * cs + cs / 2;
      const cy = Math.floor(i / SIZE) * cs + cs / 2;
      const candy = (b[i] ?? 0) as CandyId;
      for (let k = 0; k < perCell; k++) {
        parts.push({
          id: ++fxSeq,
          x: cx,
          y: cy,
          dx: (Math.random() - 0.5) * 130,
          dy: (Math.random() - 0.5) * 130,
          candy,
        });
      }
    });
    setFx((f) => [...f, ...parts]);
    setTimeout(() => setFx((f) => f.filter((p) => !parts.includes(p))), 750);
  };

  const finishMove = (nextBoard: Board, nextTray: Piece[], gainedTarget: number) => {
    const stuck = !nextTray.some((p) => canPlaceAnywhere(nextBoard, p));
    if (mode === "level") {
      setMoves((m) => {
        const left = m - 1;
        if (collected + gainedTarget >= level.targetCount) {
          sfx.levelUp();
          setStatus("won");
          return left;
        }
        if (left <= 0 || stuck) {
          sfx.gameOver();
          setStatus("lost");
        }
        return left;
      });
      return;
    }
    if (stuck) {
      sfx.gameOver();
      setStatus("lost");
    }
    if (mode === "time") setTimeLeft((t) => Math.min(t + 1, 999));
  };

  const commit = (core: DragCore, view: DragView) => {
    const b = boardStateRef.current;
    if (!view.cell || !canPlaceAt(b, core.piece, view.cell.x, view.cell.y)) {
      sfx.invalid();
      return;
    }
    const { x: cx, y: cy } = view.cell;
    const res = placePiece(b, core.piece, cx, cy, combo);
    sfx.place();

    const boardWithPiece = b.slice();
    core.piece.shape.cells.forEach(([x, y]) => {
      boardWithPiece[(cy + y) * SIZE + (cx + x)] = core.piece.candy;
    });

    const nextCombo = res.lines > 0 ? combo + 1 : 0;
    setCombo(nextCombo);
    setScore((s) => s + res.gained);
    setCollected((c) => c + (res.collected[level.targetCandy] ?? 0));

    const restTray = tray.filter((_, i) => i !== core.slot);
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

      const earned = powersEarned(res.collected);
      if (earned.length > 0) {
        setPowers((p) => [...p, ...earned].slice(0, 5));
        setTimeout(() => {
          sfx.powerGain();
          const def = POWERS.find((d) => d.kind === earned[0])!;
          pushToast("ÖZEL LOLİPOP!", def.name);
        }, 420);
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

  const commitRef = useRef(commit);
  commitRef.current = commit;

  const firePower = (index: number) => {
    if (!armed || status !== "playing") return;
    const b = boardStateRef.current;
    const res = applyPower(b, armed, index % SIZE, Math.floor(index / SIZE));
    if (res.clearedIndices.length === 0) {
      sfx.invalid();
      return;
    }
    const def = POWERS.find((d) => d.kind === armed)!;
    sfx.powerBlast();
    setClearing(new Set(res.clearedIndices));
    spawnSparkles(res.clearedIndices, b);
    setScore((s) => s + res.gained);
    setCollected((c) => c + (res.collected[level.targetCandy] ?? 0));
    pushToast(def.name.toLocaleUpperCase("tr-TR"), `+${res.gained.toLocaleString("tr-TR")}`);
    setPowers((p) => {
      const i = p.indexOf(armed);
      return i === -1 ? p : [...p.slice(0, i), ...p.slice(i + 1)];
    });
    setArmed(null);
    setTimeout(() => {
      setClearing(new Set());
      setBoard(res.board);
    }, 380);
  };

  const ghostCells = useMemo(() => {
    if (!dragView?.cell) return new Set<number>();
    const s = new Set<number>();
    dragView.piece.shape.cells.forEach(([x, y]) => {
      const gx = dragView.cell!.x + x;
      const gy = dragView.cell!.y + y;
      if (gx >= 0 && gy >= 0 && gx < SIZE && gy < SIZE) s.add(gy * SIZE + gx);
    });
    return s;
  }, [dragView]);

  const dragCell = coreRef.current?.cellSize ?? 40;

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col items-center overflow-hidden ${theme.className}`}
      style={{
        backgroundImage: themeId === "candy" ? `url(${bgImage})` : "var(--scene-bg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3 pb-5">
        <Hud
          mode={mode}
          score={score}
          best={best}
          targetCandy={level.targetCandy}
          collected={collected}
          targetCount={level.targetCount}
          moves={moves}
          level={levelIdx}
          timeLeft={timeLeft}
          combo={combo}
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <IconButton label="Ses efektleri" onClick={() => setSoundOn((v) => (setSfx(!v), !v))}>
            {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </IconButton>
          <IconButton label="Müzik" onClick={() => setMusicOn((v) => (setMusic(!v), !v))}>
            {musicOn ? <Music className="size-5" /> : <Music2 className="size-5 opacity-50" />}
          </IconButton>
          <IconButton label="Yeniden başla" onClick={() => startRound(mode, seconds, 1)}>
            <RotateCcw className="size-5" />
          </IconButton>
          <IconButton label="Menü" onClick={backToMenu}>
            <Home className="size-5" />
          </IconButton>
        </div>

        {/* Board */}
        <div className="relative">
          <div
            ref={boardRef}
            className="relative grid aspect-square w-full touch-none grid-cols-8 gap-[3px] rounded-3xl bg-boardbg p-[6px]"
            style={{
              boxShadow: "0 8px 0 oklch(0.3 0.06 265 / 0.5), 0 16px 32px oklch(0.2 0.05 280 / 0.35)",
              contain: "layout paint",
            }}
          >
            {board.map((cell, i) => {
              const isGhost = ghostCells.has(i);
              const isClearing = clearing.has(i);
              return (
                <div
                  key={i}
                  onClick={armed ? () => firePower(i) : undefined}
                  className={`relative rounded-[22%] bg-boardcell/70 ${armed ? "cursor-pointer" : ""}`}
                  style={
                    isGhost && cell === null
                      ? { outline: "2px solid var(--gold)", outlineOffset: "-1px" }
                      : armed
                        ? { outline: "1px dashed var(--gold)", outlineOffset: "-1px" }
                        : undefined
                  }
                >
                  {cell !== null && (
                    <Candy
                      id={cell}
                      className={`absolute inset-[6%] ${isClearing ? "anim-blast" : "anim-pop"}`}
                    />
                  )}
                  {cell === null && isGhost && dragView && (
                    <Candy id={dragView.piece.candy} className="absolute inset-[10%] opacity-40" />
                  )}
                </div>
              );
            })}

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
                      background: `var(--candy-${p.candy}b, var(--candy-${p.candy}))`,
                      boxShadow: `0 0 8px var(--candy-${p.candy})`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

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

        {/* Power-up bar */}
        <div className="flex min-h-11 items-center justify-center gap-2">
          {powers.length === 0 ? (
            <p className="font-display text-[11px] font-bold text-panel-foreground/70">
              Aynı renkten 5+ şeker patlat → özel lolipop kazan!
            </p>
          ) : (
            powers.map((kind, i) => {
              const def = POWERS.find((d) => d.kind === kind)!;
              const isArmed = armed === kind;
              return (
                <button
                  key={`${kind}-${i}`}
                  type="button"
                  onClick={() => setArmed(isArmed ? null : kind)}
                  title={`${def.name} · ${def.hint}`}
                  className={`relative flex size-11 items-center justify-center rounded-2xl bg-panel transition-transform active:scale-95 ${
                    isArmed ? "anim-pulse ring-2 ring-[var(--gold)]" : ""
                  }`}
                  style={{ boxShadow: "0 4px 0 oklch(0.3 0.06 265 / 0.45)" }}
                >
                  <Candy id={def.from} className="size-8" />
                  <span
                    className="pointer-events-none absolute inset-0 m-auto"
                    style={
                      kind === "rowbomb"
                        ? {
                            top: "50%",
                            height: 3,
                            background: "oklch(1 0 0 / 0.9)",
                            borderRadius: 9999,
                          }
                        : kind === "colbomb"
                          ? {
                              left: "50%",
                              width: 3,
                              background: "oklch(1 0 0 / 0.9)",
                              borderRadius: 9999,
                            }
                          : {
                              inset: "28%",
                              border: "2px dashed oklch(1 0 0 / 0.85)",
                              borderRadius: 9999,
                            }
                    }
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Tray */}
        <div
          className="mt-1 grid grid-cols-3 items-center gap-2 rounded-3xl bg-boardbg p-3"
          style={{ boxShadow: "0 6px 0 oklch(0.3 0.06 265 / 0.4)" }}
        >
          {[0, 1, 2].map((slot) => {
            const piece = tray[slot];
            if (!piece) return <div key={slot} className="h-20" />;
            const dragging = dragView?.slot === slot;
            const placeable = canPlaceAnywhere(board, piece);
            const unit = Math.min(26, 74 / Math.max(piece.shape.w, piece.shape.h));
            return (
              <div
                key={piece.uid}
                onPointerDown={onPiecePointerDown(piece, slot)}
                className={`flex h-20 cursor-grab touch-none items-center justify-center rounded-2xl select-none ${
                  dragging ? "opacity-20" : placeable ? "anim-wobble opacity-100" : "opacity-40"
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
                      className="absolute"
                      style={{ left: x * unit, top: y * unit, width: unit - 2.5, height: unit - 2.5 }}
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
      {dragView && (
        <div
          ref={floatRef}
          className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
          style={{
            width: dragView.piece.shape.w * dragCell,
            height: dragView.piece.shape.h * dragCell,
          }}
        >
          {dragView.piece.shape.cells.map(([x, y]) => (
            <Candy
              key={`${x}-${y}`}
              id={dragView.piece.candy}
              className="absolute"
              style={{
                left: x * dragCell,
                top: y * dragCell,
                width: dragCell - 3,
                height: dragCell - 3,
              }}
            />
          ))}
        </div>
      )}

      {/* Menu / overlays (backdrop blur replaced with flat bg overlay for older GPUs) */}
      {screen === "menu" && (
        <Overlay>
          <Title />
          <div className="mt-4 w-full">
            <SectionLabel>Mod</SectionLabel>
            <div className="grid gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-left font-display font-extrabold transition-transform active:scale-[0.98] ${
                    mode === m.id ? "text-accent-foreground" : "text-panel-foreground"
                  }`}
                  style={{
                    background: mode === m.id ? "var(--gradient-gold)" : "var(--color-secondary)",
                    boxShadow: mode === m.id ? "var(--shadow-candy)" : undefined,
                  }}
                >
                  <span>{m.name}</span>
                  <span className="text-[11px] font-bold opacity-75">{m.desc}</span>
                </button>
              ))}
            </div>

            {mode === "time" && (
              <>
                <SectionLabel>Süre</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeconds(s)}
                      className={`rounded-full px-3 py-1.5 font-display text-sm font-extrabold ${
                        seconds === s ? "text-accent-foreground" : "text-panel-foreground"
                      }`}
                      style={{
                        background:
                          seconds === s ? "var(--gradient-gold)" : "var(--color-secondary)",
                      }}
                    >
                      {s < 60 ? `${s} sn` : `${s / 60} dk`}
                    </button>
                  ))}
                </div>
              </>
            )}

            <SectionLabel>Tema</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`rounded-2xl px-3 py-2 text-left font-display text-sm font-extrabold ${
                    themeId === t.id ? "text-accent-foreground" : "text-panel-foreground"
                  }`}
                  style={{
                    background: themeId === t.id ? "var(--gradient-gold)" : "var(--color-secondary)",
                    boxShadow: themeId === t.id ? "var(--shadow-candy)" : undefined,
                  }}
                >
                  <span className="mb-1 flex gap-1">
                    {t.swatch.map((c) => (
                      <span
                        key={c}
                        className="size-3 rounded-full"
                        style={{ background: c, boxShadow: "inset 0 -1px 2px rgb(0 0 0 / 0.3)" }}
                      />
                    ))}
                  </span>
                  {t.name}
                  <span className="block text-[10px] font-bold opacity-75">{t.desc}</span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-center font-display text-[11px] font-bold text-panel-foreground/80">
              Rekor ({mode === "time" ? `${seconds} sn` : "genel"}):{" "}
              {best.toLocaleString("tr-TR")} · İnternet gerekmez
            </p>
          </div>
          <BigButton onClick={beginGame}>OYNA</BigButton>
        </Overlay>
      )}

      {screen === "game" && status === "won" && (
        <Overlay>
          <div
            className="font-display text-4xl font-extrabold text-outline"
            style={{ color: "var(--gold)" }}
          >
            SEVİYE {levelIdx} TAMAM!
          </div>
          <p className="mt-2 font-display text-lg font-extrabold text-panel-foreground">
            Puan: {score.toLocaleString("tr-TR")}
          </p>
          <BigButton onClick={() => startRound(mode, seconds, levelIdx + 1, true)}>
            SONRAKİ SEVİYE
          </BigButton>
          <TextButton onClick={backToMenu}>Menüye dön</TextButton>
        </Overlay>
      )}

      {screen === "game" && status === "lost" && (
        <Overlay>
          <div
            className="font-display text-4xl font-extrabold text-outline"
            style={{ color: "var(--gold)" }}
          >
            {mode === "time" ? "SÜRE BİTTİ" : "OYUN BİTTİ"}
          </div>
          <p className="mt-2 text-center font-display text-lg font-extrabold text-panel-foreground">
            Puan: {score.toLocaleString("tr-TR")}
            <br />
            <span className="text-sm opacity-80">Rekor: {best.toLocaleString("tr-TR")}</span>
          </p>
          <BigButton onClick={() => startRound(mode, seconds, 1)}>TEKRAR DENE</BigButton>
          <TextButton onClick={backToMenu}>Menüye dön</TextButton>
        </Overlay>
      )}

      <MusicSync on={musicOn && screen === "game"} />
    </div>
  );
}

function MusicSync({ on }: { on: boolean }) {
  useEffect(() => {
    if (on) startMusic();
    else stopMusic();
  }, [on]);
  return null;
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-panel-foreground active:scale-95"
      style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-candy)" }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-1.5 font-display text-[11px] font-extrabold tracking-widest uppercase text-panel-foreground/80">
      {children}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-black/60 px-5 py-6">
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-[2rem] p-5"
        style={{ background: "var(--gradient-hud)", boxShadow: "var(--shadow-panel)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Title() {
  return (
    <h1 className="text-center font-display text-4xl leading-none font-extrabold">
      <span className="text-outline block" style={{ color: "var(--candy-5)" }}>
        CANDY
      </span>
      <span className="text-outline block" style={{ color: "var(--gold)" }}>
        BLOCK BLAST!
      </span>
    </h1>
  );
}

function BigButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 rounded-full px-9 py-3 font-display text-xl font-extrabold text-accent-foreground transition-transform active:scale-95"
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-candy)" }}
    >
      {children}
    </button>
  );
}

function TextButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 font-display text-sm font-extrabold text-panel-foreground/80 underline"
    >
      {children}
    </button>
  );
}

export default CandyBlockBlast;
