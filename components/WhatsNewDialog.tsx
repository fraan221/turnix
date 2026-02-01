"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const storageKey = userId
    ? `${STORAGE_KEY_PREFIX}${version}_${userId}`
    : null;

  useEffect(() => {
    if (!storageKey) return;

    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            Mejoramos tu experiencia en Turnix
          </DialogDescription>
        </DialogHeader>

        <ul className="my-4 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
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
            className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
            target="_blank"
          >
            Leer más en el blog
            <ExternalLink className="w-4 h-4 ml-1" />
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
