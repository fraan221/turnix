"use client";

import { Link as LinkIcon, Clipboard, Check } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomUrlSectionProps {
  slug: string;
  isConfigured: boolean;
  isCopied: boolean;
  readOnly?: boolean;
  onSlugChange?: (value: string) => void;
  onCopy: () => void;
}

export function CustomUrlSection({
  slug,
  isConfigured,
  isCopied,
  readOnly = false,
  onSlugChange,
  onCopy,
}: CustomUrlSectionProps) {
  const isEditable = !isConfigured && !readOnly;

  return (
    <SettingsCard
      icon={LinkIcon}
      title={readOnly ? "Enlace Barbería" : "Enlace Personalizado"}
      description="Tu dirección pública"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-medium">
            URL
          </Label>
          <div className="flex flex-col sm:flex-row">
            <span className="inline-flex items-center px-3 h-10 text-sm rounded-t-md border border-b-0 shrink-0 border-input bg-muted text-muted-foreground sm:rounded-l-md sm:rounded-t-none sm:border-b sm:border-r-0">
              turnix.app/
            </span>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) =>
                onSlugChange?.(
                  e.target.value.toLowerCase().replace(/\s+/g, "-"),
                )
              }
              className="rounded-t-none focus-visible:ring-offset-0 read-only:cursor-not-allowed read-only:bg-muted/50 sm:rounded-l-none sm:rounded-r-none sm:rounded-t focus-visible:ring-ring"
              placeholder="nombre-barberia"
              required={!isConfigured}
              readOnly={!isEditable}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCopy}
                  className="w-full h-10 rounded-b-md border-t-0 sm:w-10 sm:rounded-b-none sm:rounded-r-md sm:border-l-0 sm:border-t"
                  aria-label="Copiar URL"
                  disabled={!slug}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clipboard className="w-4 h-4" />
                  )}
                  <span className="ml-2 sm:hidden">
                    {isCopied ? "Copiado" : "Copiar"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="hidden sm:block">
                <p>Copiar URL</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {!readOnly && (
            <div className="p-3 rounded-md border border-muted bg-muted/50">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isConfigured
                  ? "URL configurada permanentemente."
                  : "Elegí bien. No podrás cambiarlo después."}
              </p>
            </div>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
