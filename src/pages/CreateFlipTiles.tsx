import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import api from "@/api/axios";
import type { AxiosError } from "axios";

interface Tile {
  id: string;
  label: string;
}

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

function CreateFlipTiles() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([
    { id: randomId(), label: "Tile 1" },
    { id: randomId(), label: "Tile 2" },
    { id: randomId(), label: "Tile 3" },
  ]);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addTile = () => {
    setTiles((prev) => [
      ...prev,
      { id: randomId(), label: `Tile ${prev.length + 1}` },
    ]);
  };

  const removeTile = (id: string) => {
    if (tiles.length <= 1) {
      toast.error("You must have at least one tile");
      return;
    }
    setTiles((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTileLabel = (id: string, label: string) => {
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!thumbnail) {
      toast.error("Please upload a thumbnail");
      return;
    }
    if (tiles.some((t) => !t.label.trim())) {
      toast.error("All tiles must have labels");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", title);
      formData.append("description", description);
      formData.append("thumbnail_image", thumbnail);
      formData.append("game_template_slug", "flip-tiles");
      formData.append("is_published", publish.toString());

      // Store tiles in game_json
      const gameJson = {
        tiles: tiles.map((t) => ({ label: t.label })),
      };
      formData.append("game_json", JSON.stringify(gameJson));

      await api.post("/api/game/game-type/flip-tiles", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(
        publish ? "Flip Tiles game published!" : "Flip Tiles game saved!",
      );
      navigate("/my-projects");
    } catch (error: unknown) {
      console.error("Save error:", error);
      const axiosErr = error as AxiosError<{ message?: string }>;
      const message = axiosErr.response?.data?.message;
      toast.error(message ?? "Failed to save game");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-orange-500 hover:text-orange-600 mb-2 font-bold text-2xl h-auto p-0"
            onClick={() => navigate("/my-projects")}
          >
            <ArrowLeft className="w-7 h-7 mr-2" />
            Back
          </Button>
          <Typography
            variant="h2"
            className="mb-1 font-bold text-slate-900 text-2xl border-none pb-0"
          >
            Create Flip Tiles Game
          </Typography>
          <Typography variant="muted" className="text-slate-500 text-sm">
            Create interactive flip tiles for learning
          </Typography>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Basic Info */}
          <Card className="p-6">
            <Typography variant="h3" className="mb-4 border-none">
              Game Information
            </Typography>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter game title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <TextareaField
                  id="description"
                  label=""
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter game description"
                  rows={3}
                />
              </div>

              <div>
                <Dropzone
                  label="Thumbnail Image *"
                  onChange={(file) => setThumbnail(file)}
                  required
                />
                {thumbnail && (
                  <p className="text-sm text-slate-600 mt-2">
                    Selected: {thumbnail.name}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Tiles Editor */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h3" className="border-none">
                Tiles
              </Typography>
              <Button onClick={addTile} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Tile
              </Button>
            </div>

            <div className="space-y-3">
              {tiles.map((tile, index) => (
                <div key={tile.id} className="flex gap-2 items-center">
                  <span className="text-sm font-medium text-slate-600 w-8">
                    #{index + 1}
                  </span>
                  <Input
                    value={tile.label}
                    onChange={(e) => updateTileLabel(tile.id, e.target.value)}
                    placeholder={`Tile ${index + 1} label`}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTile(tile.id)}
                    disabled={tiles.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6">
            <Typography variant="h3" className="mb-4 border-none">
              Settings
            </Typography>

            <div className="flex items-center justify-between">
              <div>
                <Label>Publish Immediately</Label>
                <p className="text-sm text-slate-500">
                  Make this game visible on explore page
                </p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-6">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              size="lg"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(isPublished)}
              disabled={isSaving}
              size="lg"
            >
              {isSaving ? "Saving..." : isPublished ? "Save & Publish" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateFlipTiles;
