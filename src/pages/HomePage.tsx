import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { User, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/ui/layout/Navbar";
import thumbnailPlaceholder from "../assets/images/thumbnail-placeholder.png";
import iconSearch from "../assets/images/icon-search.svg";
import iconHeart from "../assets/images/icon-heart.svg";
import iconHeartSolid from "../assets/images/icon-heart-solid.svg";
import iconPlay from "../assets/images/icon-play.svg";
import iconVector from "../assets/images/icon-vector.svg";

type GameTemplate = {
  id: string;
  slug: string;
  name: string;
  logo: string;
  description: string;
  is_time_limit_based: boolean;
  is_life_based: boolean;
};

type Game = {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  game_template_name: string;
  game_template_slug: string;
  total_liked: number;
  total_played: number;
  creator_id: string;
  creator_name: string;
  is_game_liked: boolean;
  is_liked?: boolean;
};

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!(token && user);

  const [games, setGames] = useState<Game[]>([]);
  const [gameTemplates, setGameTemplates] = useState<GameTemplate[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [orderByCreatedAt, setOrderByCreatedAt] = useState<
    "asc" | "desc" | null
  >("desc");
  const [orderByLikeAmount, setOrderByLikeAmount] = useState<
    "asc" | "desc" | null
  >(null);
  const [orderByPlayAmount, setOrderByPlayAmount] = useState<
    "asc" | "desc" | null
  >(null);
  const [orderByName, setOrderByName] = useState<"asc" | "desc" | null>(null);
  const [gameTypeSlug, setGameTypeSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameTemplates = async () => {
      try {
        const response = await api.get("/api/game/template");
        setGameTemplates(response.data.data);
      } catch (err) {
        console.error("Failed to fetch game templates:", err);
      }
    };
    fetchGameTemplates();
  }, []);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setError(null);

        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (orderByCreatedAt)
          params.append("orderByCreatedAt", orderByCreatedAt);
        if (orderByLikeAmount)
          params.append("orderByLikeAmount", orderByLikeAmount);
        if (orderByPlayAmount)
          params.append("orderByPlayAmount", orderByPlayAmount);
        if (orderByName) params.append("orderByName", orderByName);
        if (gameTypeSlug) params.append("gameTypeSlug", gameTypeSlug);

        const queryString = params.toString();
        const url = queryString ? `/api/game?${queryString}` : "/api/game";

        const response = await api.get(url);
        console.log("Fetched games data:", response.data);

        setGames(
          response.data.data.map(
            (g: Game) =>
              ({
                ...g,
                total_liked: g.total_liked || 0,
                total_played: g.total_played || 0,
                is_liked: g.is_game_liked || false,
              }) as Game,
          ),
        );
      } catch (err) {
        setError("Failed to fetch games. Please try again later.");
        console.error("Fetch error:", err);
      } finally {
        if (initialLoading) {
          setInitialLoading(false);
        }
      }
    };
    fetchGames();
  }, [
    searchQuery,
    orderByCreatedAt,
    orderByLikeAmount,
    orderByPlayAmount,
    orderByName,
    gameTypeSlug,
    initialLoading,
  ]);

  const handleLike = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();

    const game = games.find((g) => g.id === gameId);
    if (!game) return;

    const newIsLiked = !game.is_liked;

    try {
      setGames((prev) =>
        prev.map((game) => {
          if (game.id === gameId) {
            return {
              ...game,
              is_liked: newIsLiked,
              total_liked: newIsLiked
                ? game.total_liked + 1
                : game.total_liked - 1,
            };
          }
          return game;
        }),
      );

      await api.post("/api/game/like", {
        game_id: gameId,
        is_like: newIsLiked,
      });
    } catch (err) {
      console.error("Failed to like game:", err);

      setGames((prev) =>
        prev.map((game) => {
          if (game.id === gameId) {
            return {
              ...game,
              is_liked: !newIsLiked,
              total_liked: !newIsLiked
                ? game.total_liked + 1
                : game.total_liked - 1,
            };
          }
          return game;
        }),
      );
    }
  };

  const GameCard = ({ game }: { game: Game }) => {
    const handlePlayGame = () => {
      if (game.game_template_slug === "quiz") {
        window.location.href = `/quiz/play/${game.id}`;
      } else {
        window.location.href = `/anagram/play/${game.id}`;
      }
    };

    return (
      <Card
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={handlePlayGame}
      >
        <div className="p-4 pb-0">
          <img
            src={
              game.thumbnail_image
                ? `${import.meta.env.VITE_API_URL}/${game.thumbnail_image}`
                : thumbnailPlaceholder
            }
            alt={game.thumbnail_image ? game.name : "Placeholder Thumbnail"}
            className="w-full aspect-video object-cover rounded-md"
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Typography
              variant="h4"
              className="text-base font-bold truncate pr-2"
            >
              {game.name}
            </Typography>
            <Badge variant="secondary" className="shrink-0">
              {game.game_template_name}
            </Badge>
          </div>

          <Typography variant="muted" className="text-sm mb-4">
            {game.description}
          </Typography>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-900" />
              <span className="font-medium text-slate-900">
                {game.creator_name || "Unknown User"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div
                  className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform ease-in-out duration-150"
                  onClick={(e) => handleLike(e, game.id)}
                >
                  <img
                    src={game.is_liked ? iconHeartSolid : iconHeart}
                    alt="Likes"
                    className="w-3.5 h-3.5"
                  />
                  <span>{game.total_liked}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <img src={iconHeart} alt="Likes" className="w-3.5 h-3.5" />
                  <span>{game.total_liked}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <img src={iconPlay} alt="Plays" className="w-3.5 h-3.5" />
                <span>{game.total_played} plays</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (initialLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3" className="text-destructive">
          {error}
        </Typography>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 px-6">
        <div className="mb-8">
          <Typography variant="h2" className="mb-2 border-none">
            Discover Educational Games
          </Typography>
          <Typography variant="muted">
            Explore engaging games created by educators around the world
          </Typography>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <img
              src={iconSearch}
              alt=""
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search games..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={orderByCreatedAt ? "bg-sky-100" : "bg-white"}
                >
                  Latest <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setOrderByCreatedAt(
                      orderByCreatedAt === "desc" ? null : "desc",
                    );
                    setOrderByLikeAmount(null);
                    setOrderByPlayAmount(null);
                  }}
                  className={orderByCreatedAt === "desc" ? "bg-sky-100" : ""}
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setOrderByCreatedAt(
                      orderByCreatedAt === "asc" ? null : "asc",
                    );
                    setOrderByLikeAmount(null);
                    setOrderByPlayAmount(null);
                  }}
                  className={orderByCreatedAt === "asc" ? "bg-sky-100" : ""}
                >
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    orderByLikeAmount || orderByPlayAmount
                      ? "bg-sky-100"
                      : "bg-white"
                  }
                >
                  Popular <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort by Likes</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setOrderByLikeAmount(
                      orderByLikeAmount === "desc" ? null : "desc",
                    );
                    setOrderByCreatedAt(null);
                    setOrderByPlayAmount(null);
                  }}
                  className={orderByLikeAmount === "desc" ? "bg-sky-100" : ""}
                >
                  Most Liked
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setOrderByLikeAmount(
                      orderByLikeAmount === "asc" ? null : "asc",
                    );
                    setOrderByCreatedAt(null);
                    setOrderByPlayAmount(null);
                  }}
                  className={orderByLikeAmount === "asc" ? "bg-sky-100" : ""}
                >
                  Least Liked
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort by Plays</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setOrderByPlayAmount(
                      orderByPlayAmount === "desc" ? null : "desc",
                    );
                    setOrderByCreatedAt(null);
                    setOrderByLikeAmount(null);
                  }}
                  className={orderByPlayAmount === "desc" ? "bg-sky-100" : ""}
                >
                  Most Played
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setOrderByPlayAmount(
                      orderByPlayAmount === "asc" ? null : "asc",
                    );
                    setOrderByCreatedAt(null);
                    setOrderByLikeAmount(null);
                  }}
                  className={orderByPlayAmount === "asc" ? "bg-sky-100" : ""}
                >
                  Least Played
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`w-10 px-0 ${orderByName || gameTypeSlug ? "bg-sky-100" : "bg-white"}`}
                >
                  <img src={iconVector} alt="Filter" className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort by Name</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    setOrderByName(orderByName === "desc" ? null : "desc")
                  }
                  className={orderByName === "desc" ? "bg-sky-100" : ""}
                >
                  A to Z
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setOrderByName(orderByName === "asc" ? null : "asc")
                  }
                  className={orderByName === "asc" ? "bg-sky-100" : ""}
                >
                  Z to A
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOrderByName(null)}
                  className={orderByName === null ? "bg-sky-100" : ""}
                >
                  Clear Name Sort
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setGameTypeSlug(null)}
                  className={gameTypeSlug === null ? "bg-sky-100" : ""}
                >
                  All Types
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {gameTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() =>
                      setGameTypeSlug(
                        gameTypeSlug === template.slug ? null : template.slug,
                      )
                    }
                    className={
                      gameTypeSlug === template.slug ? "bg-sky-100" : ""
                    }
                  >
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.length > 0 ? (
            games.map((game: Game) => <GameCard key={game.id} game={game} />)
          ) : (
            <div className="col-span-full text-center py-12">
              <Typography variant="muted">
                No games found. Try adjusting your search.
              </Typography>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
