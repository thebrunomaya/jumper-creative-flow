import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode, Eye } from "lucide-react";
import { Template } from "@/hooks/useTemplateList";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const navigate = useNavigate();

  // Brand identity colors
  const identityColors = {
    jumper: "bg-orange-100 text-orange-700 border-orange-300",
    koko: "bg-purple-100 text-purple-700 border-purple-300",
  };

  // Format file size (bytes to KB/MB)
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format last modified date
  const formattedDate = format(
    new Date(template.last_modified),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-lg truncate">
                {template.template_id}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`${
                  identityColors[template.brand_identity]
                } text-xs font-medium`}
              >
                {template.brand_identity === "jumper" ? "Jumper" : "Koko"}
              </Badge>

              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-600 border-gray-300 text-xs font-medium"
              >
                {formatSize(template.size)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="text-sm text-muted-foreground">
          <p className="truncate">Caminho: {template.file_path}</p>
          <p>Modificado: {formattedDate}</p>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/decks/templates/${template.template_id}/edit`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver/Editar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
