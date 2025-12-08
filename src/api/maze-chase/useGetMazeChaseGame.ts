import { useEffect, useState } from "react";
import api from "@/api/axios";

export interface Answer {
  answer_text: string;
  answer_index: number;
}

export interface Question {
  question_text: string;
  question_index: number;
  answers: Answer[];
}

export interface MazeChaseGameData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  score_per_question: number;
  map_id: string;
  countdown: number; // in minutes (converted from API seconds)
  questions: Question[];
  is_published: boolean;
}

export interface MazeChaseGameResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: MazeChaseGameData;
}

export const useGetMazeChaseGame = (gameId: string) => {
  const [data, setData] = useState<MazeChaseGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await api.get<MazeChaseGameResponse>(
          `/api/game/game-type/maze-chase/${gameId}/play/public`,
        );

        // Convert countdown from seconds to minutes
        const gameData = response.data.data;
        const countdownInMinutes = gameData.countdown * 60; // Convert minutes to seconds for timer

        setData({
          ...gameData,
          countdown: countdownInMinutes,
        });
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch game"),
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  return { data, loading, error };
};
