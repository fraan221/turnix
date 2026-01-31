"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface WhatsNewDialogProps {
  /** Unique version identifier for localStorage key, e.g. "v2026.01" */
  version: string;
  /** Dialog title */
  title: string;
  /** List of new feature bullet points */
  items: string[];
  /** Optional blog post slug to link to (without /blog/ prefix) */
  blogSlug?: string;
}

const STORAGE_KEY_PREFIX = "turnix_whats_new_";

export function WhatsNewDialog({
  version,
  title,
  items,
  blogSlug,
}: WhatsNewDialogProps) {
  const [open, setOpen] = useState(false);
  const storageKey = `${STORAGE_KEY_PREFIX}${version}`;

  useEffect(() => {
    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center items-center mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            Mejoramos tu experiencia en Turnix
          </DialogDescription>
        </DialogHeader>

        <ul className="my-4 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 items-start">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>

        {blogSlug && (
          <Link
            href={`/blog/${blogSlug}`}
            className="flex gap-1 justify-center items-center text-sm text-primary hover:underline"
          >
            Leer más en el blog
            <ExternalLink className="ml-1 w-4 h-4" />
          </Link>
        )}

        <DialogFooter className="mt-4">
          <Button onClick={handleDismiss} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
