"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher-client";
import { useLoader } from "@/context/LoaderContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, ClipboardCheck } from "lucide-react";

interface ConnectionCodeViewProps {
  connectionCode: string;
}

export function ConnectionCodeView({
  connectionCode,
}: ConnectionCodeViewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { data: session, update } = useSession();
  const router = useRouter();
  const { showLoader } = useLoader();
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe(`user-${session.user.id}`);

    const handleTeamJoined = async () => {
      if (isUpdating.current) return;
      isUpdating.current = true;
      showLoader("¡Te han añadido a un equipo! Sincronizando tu cuenta...");
      await update();
      router.refresh();
    };

    channel.bind("team-joined", handleTeamJoined);

    return () => {
      pusherClient.unsubscribe(`user-${session.user.id}`);
      channel.unbind("team-joined", handleTeamJoined);
    };
  }, [session, router, update, showLoader]);

  const handleCopy = () => {
    navigator.clipboard.writeText(connectionCode);
    setIsCopied(true);
    toast.success("¡Código copiado!", {
      description: "Ya puedes compartirlo con el dueño de la barbería.",
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl">¡Ya casi estás listo!</CardTitle>
          <CardDescription className="pt-2 text-base">
            Para empezar a usar tu agenda, el dueño de la barbería debe añadirte
            a su equipo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Comparte el siguiente código con el dueño:
          </p>
          <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg bg-muted">
            <p className="font-mono text-4xl font-bold tracking-widest text-primary">
              {connectionCode}
            </p>
          </div>
          <Button size="lg" onClick={handleCopy} className="w-full max-w-xs">
            {isCopied ? (
              <ClipboardCheck className="w-5 h-5 mr-2" />
            ) : (
              <Clipboard className="w-5 h-5 mr-2" />
            )}
            {isCopied ? "Copiado" : "Copiar Código"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Una vez que te hayan añadido al equipo, esta pantalla se actualizará
            automáticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
