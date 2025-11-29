import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";

type GameTemplate = {
  id: string;
  slug: string;
  name: string;
  logo: string;
  description: string;
  is_time_limit_based: boolean;
  is_life_based: boolean;
};

const getIconComponent = (
  iconName: string,
): React.ComponentType<{ className?: string }> => {
  const pascalCase = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >;
  const IconComponent = icons[pascalCase];

  return IconComponent || LucideIcons.HelpCircle;
};

export default function CreateProject() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/game/template");
        setTemplates(response.data.data);
      } catch (err) {
        setError("Failed to fetch game templates. Please try again later.");
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateClick = (template: GameTemplate) => {
    if (template.slug === "quiz") {
      navigate("/create-quiz");
    } else if (template.slug === "flip-tiles") {
      navigate("/create-flip-tiles");
    } else {
      toast.error(`${template.name} template is coming soon!`, {
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3">Loading templates...</Typography>
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
    <div className="min-h-screen bg-slate-50 font-sans">
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
            Choose a Template
          </Typography>
          <Typography variant="muted" className="text-slate-500 text-sm">
            Select the type of game you want to create
          </Typography>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const IconComponent = getIconComponent(template.logo);

              return (
                <Card
                  key={template.id}
                  className="p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all duration-200 group bg-white rounded-xl"
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 transition-colors">
                      <IconComponent className="w-8 h-8 text-sky-600" />
                    </div>
                    <div className="pt-1">
                      <Typography
                        variant="h4"
                        className="text-base font-bold mb-1 text-slate-900 group-hover:text-blue-600 transition-colors"
                      >
                        {template.name}
                      </Typography>
                      <Typography
                        variant="small"
                        className="text-slate-500 leading-snug font-normal"
                      >
                        {template.description}
                      </Typography>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
