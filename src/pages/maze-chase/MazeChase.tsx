import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import StartScreen from "./components/StartScreen";
import Maps from "./components/Maps";
import PauseDialog from "./components/PauseDialog";
import { useGetMazeChaseGame } from "@/api/maze-chase/useGetMazeChaseGame";
import heart from "./assets/heart.png";
import forrest from "./assets/maze/bg_maze.jpg";
import start from "./assets/start.png";

type MoveDir = "up" | "down" | "left" | "right" | null;

const Game = () => {
  const { id } = useParams<{ id: string }>();
  const { data: gameData } = useGetMazeChaseGame(id || "");

  const [stage, setStage] = useState<"start" | "zoom" | "maze">("start");
  const [hideButton, setHideButton] = useState(false);
  const [moveDir, setMoveDir] = useState<MoveDir>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [currentQuestionIndex] = useState(0);

  // Initialize countdown from API
  useEffect(() => {
    if (gameData?.countdown) {
      setCountdown(gameData.countdown);
    }
  }, [gameData]);

  // Countdown timer
  useEffect(() => {
    if (stage !== "maze" || isPaused || countdown === null || countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, isPaused, countdown]);

  // Format countdown to MM:SS
  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setHideButton(true);

    setTimeout(() => {
      setStage("zoom");
    }, 200);

    setTimeout(() => {
      setStage("maze");
    }, 1400);
  };

  const handleDirectionClick = (dir: Exclude<MoveDir, null>) => {
    setMoveDir(dir);
  };

  const handlePauseClick = () => {
    setIsPaused(true);
    setShowPauseDialog(true);
  };

  const handleResume = () => {
    setShowPauseDialog(false);
    setIsPaused(false);
  };

  const handleRestart = () => {
    setShowPauseDialog(false);
    setIsPaused(false);
    setStage("start");
    setHideButton(false);
    setMoveDir(null);
    setCountdown(gameData?.countdown || null);
  };

  const handleAnswerSelected = (answerIndex: number) => {
    console.log("Answer selected:", answerIndex);
    // TODO: Implement answer validation logic here
    // You can check if it's correct answer and proceed to next question
  };

  return (
    <>
      <style>
        {`          
          @keyframes zoomCenter {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(1.8); opacity: 1; }
          }
          .zoom-center {
            animation: zoomCenter 1.4s ease-out forwards;
          }

          @keyframes mazePop {
            from { transform: scale(0.2); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .maze-pop {
            animation: mazePop 0.6s ease-out forwards;
          }
        `}
      </style>

      {/* 1️⃣ Start Screen */}
      {stage === "start" && (
        <StartScreen hideButton={hideButton} onStart={handleStart} />
      )}

      {/* 2️⃣ Zoom Animation */}
      {stage === "zoom" && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-cover bg-center zoom-center"
          style={{
            backgroundImage: `url(${start})`,
          }}
        ></div>
      )}

      {/* 3️⃣ Maze Page */}
      {stage === "maze" && (
        <div
          className="w-screen h-screen bg-cover bg-center relative maze-pop"
          style={{ backgroundImage: `url(${forrest})` }}
        >
          {/* HUD Atas (timer + hearts) */}
          <div className="absolute top-4 left-4 text-white text-2xl md:text-3xl font-bold drop-shadow-lg z-40">
            {formatCountdown(countdown)}
          </div>

          {/* Pause Button */}
          <div className="absolute top-4 right-6 z-50">
            <button
              onClick={handlePauseClick}
              className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 rounded-lg text-white text-2xl md:text-3xl flex justify-center items-center backdrop-blur-md transition-colors"
            >
              ☰
            </button>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2 z-40">
            <img src={heart} className="w-7 md:w-10" />
            <img src={heart} className="w-7 md:w-10" />
            <img src={heart} className="w-7 md:w-10" />
          </div>

          {/* GAMEBOARD LAYOUT */}
          <div className="flex flex-col w-full h-full pt-16 pb-20 px-3 md:px-8">
            {/* Question Box */}
            <div className="flex justify-center mb-2">
              <div className="bg-black/60 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-lg rounded-xl max-w-3xl text-center backdrop-blur-md">
                {gameData?.questions && gameData.questions.length > 0
                  ? gameData.questions[currentQuestionIndex]?.question_text
                  : "Loading question..."}
              </div>
            </div>

            {/* Maze di tengah */}
            <div className="flex-1 h-5 flex items-center justify-center">
              <Maps
                mapId={1}
                controlDirection={moveDir}
                isPaused={isPaused}
                answers={gameData?.questions?.[currentQuestionIndex]?.answers}
                onAnswerSelected={handleAnswerSelected}
              />
            </div>

            {/* Arrow Controls (mobile-friendly) */}
            <div className="md:hidden mt-2 mb-2 flex justify-center">
              <div className="flex flex-col items-center">
                {/* Atas */}
                <button
                  onClick={() => handleDirectionClick("up")}
                  className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md"
                >
                  ▲
                </button>

                {/* Kiri – Bawah – Kanan */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDirectionClick("left")}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md -rotate-90"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleDirectionClick("right")}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md rotate-90"
                  >
                    ▲
                  </button>
                </div>

                {/* Bawah */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDirectionClick("down")}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Dialog */}
      <PauseDialog
        isOpen={showPauseDialog}
        onClose={() => {
          setShowPauseDialog(false);
          setIsPaused(false);
        }}
        onResume={handleResume}
        onRestart={handleRestart}
      />
    </>
  );
};

export default Game;
