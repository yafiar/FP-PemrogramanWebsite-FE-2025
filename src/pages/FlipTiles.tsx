import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
// Removed Dialog in favor of custom zoom overlay animation
import { ArrowLeft } from "lucide-react";
import api from "@/api/axios";
import toast from "react-hot-toast";

type Tile = {
  label: string;
  flipped: boolean;
  removed: boolean;
  id: string;
  color: string; // tailwind color class
  justRemoved?: boolean;
  justRestored?: boolean;
  animMove?: boolean;
  dx?: string; // translateX
  dy?: string; // translateY
  rot?: string; // rotation
};

type GameData = {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  game_json: {
    tiles: { label: string }[];
  };
};

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlipTiles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [spinnerTarget, setSpinnerTarget] = useState<string | null>(null);
  const [zoomedTile, setZoomedTile] = useState<string | null>(null);
  const [zoomFromRect, setZoomFromRect] = useState<DOMRect | null>(null);
  const [zoomLeaving, setZoomLeaving] = useState(false);
  // Removed hamburger/menu; keep core gameplay

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        let gameResponse;
        try {
          // Try public endpoint first (if backend supports it)
          gameResponse = await api.get(
            `/api/game/game-type/flip-tiles/${id}/play/public`,
          );
        } catch {
          // Fallback to protected detail endpoint
          gameResponse = await api.get(`/api/game/game-type/flip-tiles/${id}`);
        }
        const game = gameResponse.data.data;
        setGameData(game);

        if (game.game_json && game.game_json.tiles) {
          const palette = [
            "bg-red-500",
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-yellow-500",
            "bg-orange-500",
            "bg-teal-500",
            "bg-fuchsia-500",
            "bg-cyan-500",
            "bg-lime-500",
          ];
          setTiles(
            game.game_json.tiles.map((t: { label: string }, idx: number) => ({
              id: randomId(),
              label: t.label,
              flipped: false,
              removed: false,
              color: palette[idx % palette.length],
            })),
          );
        }

        try {
          await api.post("/api/game/play-count", { game_id: id });
        } catch (playErr) {
          console.warn("Play count update failed", playErr);
        }
      } catch (err: unknown) {
        console.error("Failed to load Flip Tiles game:", err);
        setError("Failed to load Flip Tiles game. Please try again.");
        toast.error("Failed to load Flip Tiles game");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGame();
    } else {
      // Fallback: show demo tiles so page isn't stuck loading
      const demoTiles = Array.from({ length: 12 }, (_, i) => ({
        label: `Demo ${i + 1}`,
      }));
      const palette = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-yellow-500",
        "bg-orange-500",
        "bg-teal-500",
        "bg-fuchsia-500",
        "bg-cyan-500",
        "bg-lime-500",
      ];
      setGameData({
        id: "demo",
        name: "Flip Tiles Demo",
        description: "Demo mode (no game id provided).",
        thumbnail_image: null,
        game_json: { tiles: demoTiles },
      });
      setTiles(
        demoTiles.map((t, idx) => ({
          id: randomId(),
          label: t.label,
          flipped: false,
          removed: false,
          color: palette[idx % palette.length],
        })),
      );
      setLoading(false);
    }
  }, [id]);

  const [tileHeight, setTileHeight] = useState(100);
  // Shuffling flag no longer needed after refactor
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute columns to fill available width. Use rounding to reduce unused right space.
  const [columns, setColumns] = useState(4);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevPositionsRef = useRef<Record<string, DOMRect>>({});

  // Responsive columns based on width
  useLayoutEffect(() => {
    function computeColumns() {
      const w = window.innerWidth; // full viewport width for better fill
      const minTile = 190; // target min width per tile
      const raw = Math.max(1, Math.min(tiles.length, Math.round(w / minTile)));
      const clamped = Math.min(5, raw); // enforce max 5 columns but stretch width
      setColumns(clamped);
    }
    computeColumns();
    window.addEventListener("resize", computeColumns);
    return () => window.removeEventListener("resize", computeColumns);
  }, [tiles.length]);

  // Width-based rectangular height (undo vertical fill)
  useEffect(() => {
    function computeRectangularHeight() {
      const viewportW = window.innerWidth - 48; // approximate horizontal padding
      if (columns === 0) return;
      const gap = 12;
      const tileWidth = (viewportW - (columns - 1) * gap) / columns;
      // Use the previous ratio 0.45 with sensible min
      const height = Math.max(88, Math.round(tileWidth * 0.45));
      setTileHeight(height);
    }
    computeRectangularHeight();
    window.addEventListener("resize", computeRectangularHeight);
    return () => window.removeEventListener("resize", computeRectangularHeight);
  }, [columns]);

  const flipTile = (tileId: string) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, flipped: !t.flipped } : t)),
    );
    setZoomedTile(null);
  };

  const removeTile = (tileId: string) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, justRemoved: true } : t)),
    );
    setTimeout(() => {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === tileId ? { ...t, removed: true, justRemoved: false } : t,
        ),
      );
    }, 380);
    setZoomedTile(null);
  };

  const restoreAll = () => {
    setTiles((prev) =>
      prev.map((t) =>
        t.removed
          ? { ...t, flipped: false, removed: false, justRestored: true }
          : { ...t, flipped: false },
      ),
    );
    setTimeout(() => {
      setTiles((prev) => prev.map((t) => ({ ...t, justRestored: false })));
    }, 420);
    setSpinnerTarget(null);
    setZoomedTile(null);
  };

  const shuffleTiles = () => {
    // Capture current positions for FLIP (all tiles, including removed)
    const currentPositions: Record<string, DOMRect> = {};
    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (el) currentPositions[id] = el.getBoundingClientRect();
    });
    prevPositionsRef.current = currentPositions;
    setTiles((prev) => {
      // Shuffle entire array so removed placeholders also move
      const shuffled = shuffleArray(prev);
      return shuffled;
    });
  };

  // Perform FLIP animation after reorder
  useLayoutEffect(() => {
    const prevPositions = prevPositionsRef.current;
    if (!Object.keys(prevPositions).length) return;
    const newPositions: Record<string, DOMRect> = {};
    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (el) newPositions[id] = el.getBoundingClientRect();
    });
    Object.entries(newPositions).forEach(([id, newRect]) => {
      const prev = prevPositions[id];
      if (!prev) return;
      const dx = prev.left - newRect.left;
      const dy = prev.top - newRect.top;
      if (dx === 0 && dy === 0) return;
      const el = cardRefs.current[id];
      if (!el) return;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = "none";
      requestAnimationFrame(() => {
        el.style.transform = "translate(0,0)";
        el.style.transition = "transform 600ms cubic-bezier(.4,.2,.2,1)";
      });
    });
    prevPositionsRef.current = {};
  }, [tiles]);

  const spinRandom = () => {
    const candidates = tiles.filter((t) => !t.removed);
    if (candidates.length === 0) return;
    const spins = 20;
    let idx = 0;
    const interval = setInterval(() => {
      const pick = candidates[idx % candidates.length];
      setSpinnerTarget(pick.id);
      idx++;
      if (idx >= spins) {
        clearInterval(interval);
        const finalPick =
          candidates[Math.floor(Math.random() * candidates.length)];
        setSpinnerTarget(finalPick.id);
        setZoomedTile(finalPick.id); // auto-open after random spin finishes
      }
    }, 100);
  };

  const zoomedTileData = tiles.find((t) => t.id === zoomedTile);
  // Removed show-all and restart actions (were hamburger menu features)

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">{error ?? "Game not found"}</Typography>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  // Cleanup no longer needed (removed cascade timeouts)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-orange-500 hover:text-orange-600"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Exit Game
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="mb-6 text-center">
          <Typography variant="h2" className="mb-2 border-none">
            {gameData.name}
          </Typography>
          <Typography variant="muted">{gameData.description}</Typography>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Button variant="outline" onClick={shuffleTiles}>
            Shuffle
          </Button>
          <Button variant="outline" onClick={restoreAll}>
            Restore All
          </Button>
          <Button onClick={spinRandom}>Random Spinner</Button>
        </div>

        <div className="w-full border rounded-xl bg-white shadow-sm p-4 h-[calc(100vh-260px)] overflow-hidden">
          <div
            ref={containerRef}
            className="grid w-full h-full content-start"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}
          >
            {tiles.map((tile) => {
              if (tile.justRemoved) {
                return (
                  <Card
                    key={tile.id}
                    ref={(r) => {
                      cardRefs.current[tile.id] = r;
                    }}
                    className="p-4 select-none flex items-center justify-center border-2 border-dashed opacity-100 animate-tile-remove"
                    style={{ height: tileHeight }}
                  >
                    <span className="text-xs text-slate-400">Removed</span>
                  </Card>
                );
              }
              if (tile.removed) {
                return (
                  <div
                    key={tile.id}
                    ref={(r) => {
                      cardRefs.current[tile.id] = r;
                    }}
                    className="p-4 select-none border-2 border-dashed rounded-md opacity-40"
                    style={{ height: tileHeight }}
                  ></div>
                );
              }
              return (
                <Card
                  key={tile.id}
                  ref={(r) => {
                    cardRefs.current[tile.id] = r;
                  }}
                  className={`p-2 select-none transition-all cursor-pointer hover:shadow-lg flex items-center justify-center rounded-md ${spinnerTarget === tile.id ? "ring-4 ring-sky-500" : ""} ${tile.justRestored ? "animate-tile-restore" : ""}`}
                  onClick={() => {
                    const el = cardRefs.current[tile.id];
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      setZoomFromRect(rect);
                    }
                    setZoomedTile(tile.id);
                  }}
                  style={{ height: tileHeight }}
                >
                  <div
                    className={`w-full h-full rounded-md flex items-center justify-center font-semibold tracking-wide text-white shadow-inner transition-transform duration-500 will-change-transform ${tile.flipped ? "bg-slate-900 animate-tile-flip" : tile.color}`}
                    style={{
                      fontSize: `clamp(0.7rem, ${tileHeight / 110}rem, 1rem)`,
                    }}
                  >
                    {tile.flipped ? "?" : tile.label}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {tiles.every((t) => t.removed) && (
          <div className="text-center py-12">
            <Typography variant="muted">
              All tiles removed. Click Restore All to bring them back.
            </Typography>
          </div>
        )}
      </div>

      {zoomedTile && zoomedTileData && zoomFromRect && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 ${zoomLeaving ? "pointer-events-none" : ""}`}
          onClick={() => {
            setZoomLeaving(true);
            setTimeout(() => {
              setZoomedTile(null);
              setZoomFromRect(null);
              setZoomLeaving(false);
            }, 300);
          }}
        >
          <div
            className={`${zoomLeaving ? "zoom-overlay-exit" : "zoom-overlay-enter"} relative rounded-xl shadow-xl flex flex-col bg-white border`}
            style={{
              width: "min(90vw, 480px)",
              ...({
                "--from-transform": `translate(${zoomFromRect.left + zoomFromRect.width / 2}px, ${
                  zoomFromRect.top + zoomFromRect.height / 2
                }px) translate(-50%, -50%) scale(${Math.min(
                  zoomFromRect.width / 480,
                  zoomFromRect.height / 480,
                )})`,
              } as React.CSSProperties),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-5">
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-5xl font-bold ${zoomedTileData.flipped ? "bg-slate-900 text-white" : "bg-slate-100 border-2"}`}
              >
                {zoomedTileData.flipped ? "?" : zoomedTileData.label}
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => flipTile(zoomedTileData.id)}
                >
                  {zoomedTileData.flipped ? "Unflip" : "Flip"}
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => removeTile(zoomedTileData.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
