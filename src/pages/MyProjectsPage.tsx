import { useState, useEffect } from "react";
import api from "@/api/axios";

import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/ui/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useNavigate } from "react-router-dom";
import thumbnailPlaceholder from "../assets/images/thumbnail-placeholder.png";
import iconPlus from "../assets/images/icon-plus.svg";
import iconSearch from "../assets/images/icon-search.svg";
import iconFolderLarge from "../assets/images/icon-folder-large.svg";
import { EyeOff, Eye, Edit, Trash2, Play } from "lucide-react";
import toast from "react-hot-toast";

type Project = {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  is_published: boolean;
  game_template: number;
  game_template_slug: string;
};

export default function MyProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/auth/me/game");
        setProjects(response.data.data);
      } catch (err) {
        setError("Failed to fetch projects. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDeleteProject = async (
    projectId: string,
    gameTypeSlug: string,
  ) => {
    try {
      await api.delete(`/api/game/game-type/${gameTypeSlug}/${projectId}`);

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted successfully!");
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast.error("Failed to delete project. Please try again.");
    }
  };

  const handleUpdateStatus = async (
    gameId: string,
    isPublish: boolean,
    gameTypeSlug: string,
  ) => {
    try {
      const form = new FormData();
      form.append("is_publish", String(isPublish));

      const response = await api.patch(
        `/api/game/game-type/${gameTypeSlug}/${gameId}`,
        form,
      );

      if (response.status !== 200) {
        console.log("Error response:", response.data);
        throw new Error("Failed to update status.");
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === gameId ? { ...p, is_published: isPublish } : p,
        ),
      );

      toast.success(
        isPublish ? "Published successfully" : "Unpublished successfully",
      );
    } catch (err) {
      console.error("Failed to update publish status:", err);
      toast.error("Failed to update status. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  if (error)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3" className="text-destructive">
          {error}
        </Typography>
      </div>
    );

  const EmptyState = () => (
    <Card className="flex flex-col items-center justify-center text-center p-12 md:p-20 mt-6">
      <img
        src={iconFolderLarge}
        alt="No projects"
        className="w-20 h-20 mb-6 text-gray-400"
      />
      <Typography variant="h3" className="mb-2">
        You haven't created any games yet
      </Typography>
      <Typography variant="muted" className="max-w-sm mb-8">
        Get started by choosing a template and building your first educational
        game.
      </Typography>
      <Button
        size="lg"
        className="w-full max-w-xs"
        onClick={() => navigate("/create-projects")}
      >
        <img src={iconPlus} alt="" className="w-5 h-5 mr-2" />
        Create Your First Game
      </Button>
    </Card>
  );

  const ProjectList = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-1 mt-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="relative p-4 h-fit sm:h-80 md:h-fit cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="w-full h-full flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="w-full h-full flex flex-col md:flex-row md:items-center gap-4">
              <img
                src={
                  project.thumbnail_image
                    ? `${import.meta.env.VITE_API_URL}/${project.thumbnail_image}`
                    : thumbnailPlaceholder
                }
                alt={
                  project.thumbnail_image
                    ? project.name
                    : "Placeholder Thumbnail"
                }
                className="w-full md:w-28 md:h-24 rounded-md object-cover"
              />
              <div className="flex flex-col md:gap-6 justify-between items-stretch h-full w-full">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <Typography variant="p" className="font-semibold">
                      {project.name}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-sm text-muted-foreground"
                    >
                      {project.description}
                    </Typography>
                  </div>
                  <div className="md:hidden">
                    <Badge
                      variant={project.is_published ? "default" : "destructive"}
                      className={
                        project.is_published
                          ? "capitalize bg-green-100 text-green-800"
                          : "capitalize bg-yellow-100 text-yellow-800"
                      }
                    >
                      {project.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-6 md:mt-2">
                  {project.is_published ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        const slug = project.game_template_slug || "anagram";
                        navigate(`/${slug}/play/${project.id}`);
                      }}
                    >
                      <Play />
                      Play
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      const slug = project.game_template_slug || "anagram";
                      navigate(`/${slug}/edit/${project.id}`);
                    }}
                  >
                    <Edit />
                    Edit
                  </Button>
                  {project.is_published ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        const slug = project.game_template_slug || "anagram";
                        handleUpdateStatus(project.id, false, slug);
                      }}
                    >
                      <EyeOff />
                      Unpublish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        const slug = project.game_template_slug || "anagram";
                        handleUpdateStatus(project.id, true, slug);
                      }}
                    >
                      <Eye />
                      Publish
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <b>{project.name}</b>?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            const slug =
                              project.game_template_slug || "anagram";
                            handleDeleteProject(project.id, slug);
                          }}
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {/* Right side: Badge */}
            <div className="hidden md:block">
              <Badge
                variant={project.is_published ? "default" : "destructive"}
                className={
                  project.is_published
                    ? "text-sm px-3 bg-green-100 text-green-800"
                    : "text-sm px-3 bg-yellow-100 text-yellow-800"
                }
              >
                {project.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto py-10 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Typography variant="h2">
              My Projects ({projects.length})
            </Typography>
            <Typography variant="muted">
              Manage your educational games
            </Typography>
          </div>
          <Button onClick={() => navigate("/create-projects")}>
            <img src={iconPlus} alt="" className="w-5 h-5 mr-2" />
            New Game
          </Button>
        </div>
        <div className="mt-6 relative">
          <img
            src={iconSearch}
            alt=""
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input placeholder="Search your projects..." className="pl-10" />
        </div>
        {projects.length === 0 ? <EmptyState /> : <ProjectList />}
      </main>
    </div>
  );
}
