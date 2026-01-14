"use client";

import { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  icon: Icon,
  title,
  description,
  disabled = false,
  badge,
  children,
  className,
}: SettingsCardProps) {
  return (
    <Card
      className={cn(
        "border border-border/50 shadow-sm transition-all",
        disabled && "opacity-60 pointer-events-none select-none",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-muted">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold leading-none">
                {title}
              </CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs font-medium">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
