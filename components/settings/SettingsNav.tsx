"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

interface SettingsNavProps {
  items: SettingsNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ items, activeId, onSelect }: SettingsNavProps) {
  return (
    <>
      <nav className="hidden w-56 md:block shrink-0">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => !item.disabled && onSelect(item.id)}
                  disabled={item.disabled}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="-mx-4 mb-6 border-b md:hidden">
        <div className="flex overflow-x-auto px-4 scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !item.disabled && onSelect(item.id)}
                disabled={item.disabled}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
