"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationsAsRead } from "@/actions/notification.actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markNotificationsAsRead();
      router.refresh();
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllAsRead}
      disabled={isPending}
    >
      <CheckCheck className="w-4 h-4 mr-2" aria-hidden="true" />
      Marcar todas como leídas
    </Button>
  );
}
