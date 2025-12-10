import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as Progress from "@radix-ui/react-progress";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Trophy } from "lucide-react";

interface Answer {
  answer_index: number;
  answer_text: string;
}

interface Question {
  question_text: string;
  question_image: string | null;
  question_index: number;
  answers: Answer[];
}

interface QuizData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  is_published: boolean;
  questions: Question[];
  score_per_question: number;
}

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [userAnswers, setUserAnswers] = useState<
    { question_index: number; selected_answer_index: number }[]
  >([]);

  const [finished, setFinished] = useState(false);

  const [result, setResult] = useState<{
    correct_answers: number;
    total_questions: number;
    max_score: number;
    score: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/quiz/${id}/play/public`,
        );
        setQuiz(response.data.data);
      } catch (err) {
        setError("Failed to load quiz.");
        console.error(err);
        toast.error("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuiz();
  }, [id]);

  if (!quiz) return null;

  const questions = quiz.questions;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;
  const progress = (currentQuestion / questions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const updatedAnswers = [
      ...userAnswers,
      {
        question_index: questions[currentQuestion].question_index,
        selected_answer_index: selectedAnswer,
      },
    ];

    setUserAnswers(updatedAnswers);

    if (!isLastQuestion) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      submitQuiz(updatedAnswers);
    }
  };

  const addPlayCount = async (gameId: string) => {
    try {
      await api.post("/api/game/play-count", {
        game_id: gameId,
      });
    } catch (err) {
      console.error("Failed to update play count:", err);
      toast.error("Failed to update play count.");
    }
  };

  const submitQuiz = async (finalAnswers?: typeof userAnswers) => {
    try {
      setLoading(true);

      const response = await api.post(`/api/game/game-type/quiz/${id}/check`, {
        answers: finalAnswers ?? userAnswers,
      });

      setResult(response.data.data);

      // Increment play count for all users (both authenticated and public)
      await addPlayCount(id!);

      setFinished(true);
    } catch (err) {
      console.error(err);
      setError("Failed to submit quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !finished) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">{error ?? "Quiz not found"}</Typography>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  if (finished && result) {
    const { correct_answers, total_questions, max_score, score, percentage } =
      result;

    const starCount = (percentage / 100) * 5;
    const fullStars = Math.floor(starCount);
    const halfStar = starCount - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let feedback = "Good effort!";
    if (percentage === 100) feedback = "Perfect Score!";
    else if (percentage >= 80) feedback = "Great job!";
    else if (percentage >= 50) feedback = "Nice try!";
    else feedback = "Better luck next time!";

    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="bg-white rounded-xl p-10 mx-10 text-center max-w-sm w-full space-y-4 shadow-lg">
          <Trophy className="mx-auto text-yellow-400" size={72} />
          <Typography variant="h4">{feedback}</Typography>
          <Typography variant="h2">
            {correct_answers}/{total_questions}
          </Typography>
          <Typography variant="p">
            Score: {score} / {max_score}
          </Typography>
          <Typography variant="p">{percentage}% Accuracy</Typography>
          <div className="flex justify-center gap-1 text-yellow-400 text-xl">
            {Array.from({ length: fullStars }).map((_, i) => (
              <span key={i}>★</span>
            ))}
            {halfStar && <span>☆</span>}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <span key={i} className="text-gray-300">
                ★
              </span>
            ))}
          </div>
          <Button
            className="w-full mt-4"
            onClick={() => {
              setFinished(false);
              setResult(null);
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setUserAnswers([]);
            }}
          >
            Play Again
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Exit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4 shadow-sm">
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex"
            onClick={() => navigate("/")}
          >
            <ArrowLeft /> Exit Game
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="block md:hidden"
            onClick={() => navigate("/")}
          >
            <ArrowLeft />
          </Button>
        </div>
      </div>
      <div className="w-full h-full p-8 flex justify-center items-center">
        <div className="max-w-3xl w-full space-y-6">
          <div className="flex w-full mb-4 justify-between items-center">
            <Typography variant="p">
              Question {currentQuestion + 1} of {questions.length}
            </Typography>
            <Typography variant="p">{Math.round(progress)}%</Typography>
          </div>
          <Progress.Root
            className="w-full h-3 bg-slate-300 rounded overflow-hidden"
            value={progress}
          >
            <Progress.Indicator
              className="h-full bg-slate-800 transition-all"
              style={{ width: `${progress}%` }}
            />
          </Progress.Root>

          <div className="bg-white w-full p-8 text-center space-y-6 rounded-xl border shadow-sm">
            <Typography variant="p">{currentQ.question_text}</Typography>

            {currentQ.question_image && (
              <img
                src={`${import.meta.env.VITE_API_URL}/${currentQ.question_image}`}
                alt="Question"
                className="mx-auto max-h-64 object-contain rounded-md"
              />
            )}

            <div className="grid grid-cols-1 gap-4">
              {currentQ.answers.map((opt, idx) => {
                const isSelected = selectedAnswer === opt.answer_index;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className={`w-full justify-start p-7 gap-2 transition ${
                      isSelected ? "bg-primary text-white" : ""
                    }`}
                    onClick={() => setSelectedAnswer(opt.answer_index)}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isSelected
                          ? "bg-white text-primary"
                          : "bg-gray-100 text-black"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt.answer_text}</span>
                  </Button>
                );
              })}
            </div>
            <div
              className={`mt-6 flex w-full ${
                isFirstQuestion ? "justify-end" : "justify-between"
              }`}
            >
              {!isFirstQuestion && (
                <Button
                  onClick={() => {
                    setCurrentQuestion((prev) => prev - 1);
                    setSelectedAnswer(null);
                  }}
                >
                  <ArrowLeft className="mr-1" /> Previous
                </Button>
              )}
              <Button onClick={handleNext} disabled={selectedAnswer === null}>
                {isLastQuestion ? "Submit Quiz" : "Next Question"}
                {!isLastQuestion && <ArrowLeft className="rotate-180 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
