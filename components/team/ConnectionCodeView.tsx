"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useBroadcast } from "@/hooks/use-broadcast";
import { useLoader } from "@/context/LoaderContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, ClipboardCheck, Users, Zap } from "lucide-react";

interface ConnectionCodeViewProps {
  connectionCode: string;
}

export function ConnectionCodeView({
  connectionCode,
}: ConnectionCodeViewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { data: session, update } = useSession();
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const navigationTriggered = useRef(false);

  const handleTeamJoined = useCallback(async () => {
    showLoader("¡Te han añadido a un equipo! Actualizando tu sesión...");

    try {
      await update({ forceRefetch: true });
    } catch (error) {
      console.error("Error al forzar la actualización de la sesión:", error);
      router.refresh();
    }
  }, [showLoader, update, router]);

  useBroadcast(session?.user?.id, (event, _payload) => {
    if (event === "team-joined") {
      handleTeamJoined();
    }
  });

  useEffect(() => {
    if (session?.user?.teamMembership && !navigationTriggered.current) {
      navigationTriggered.current = true;

      console.log("Sesión actualizada detectada. Navegando al dashboard.");

      toast.success("¡Sincronización completa!", {
        description: "Bienvenido a tu nuevo equipo.",
      });

      setTimeout(() => {
        hideLoader();
        window.location.href = "/dashboard";
      }, 500);
    }
  }, [session, hideLoader]);

  const handleCopy = () => {
    navigator.clipboard.writeText(connectionCode);
    setIsCopied(true);
    toast.success("¡Código copiado!", {
      description: "Ahora solo falta compartirlo con tu jefe.",
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-6">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="pb-4 space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold leading-tight text-center sm:text-3xl">
            Un paso más para empezar
          </CardTitle>

          <CardDescription className="text-base leading-relaxed text-center sm:text-lg">
            Necesitás que el dueño de la barbería te agregue a su equipo
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-center text-foreground/80">
              Compartí este código con tu jefe:
            </p>

            <div className="relative">
              <div className="flex justify-center items-center p-6 rounded-xl border-2 border-dashed sm:p-8 border-primary/30 bg-primary/5">
                <p className="font-mono text-4xl sm:text-5xl font-bold tracking-[0.3em] text-primary select-all">
                  {connectionCode}
                </p>
              </div>

              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-background border border-primary/20 rounded-full text-primary shadow-sm">
                  <Zap className="w-3 h-3" />
                  Código único
                </span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleCopy}
            className="w-full h-12 text-base font-semibold shadow-md transition-all hover:shadow-lg"
          >
            {isCopied ? (
              <>
                <ClipboardCheck className="mr-2 w-5 h-5" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Clipboard className="mr-2 w-5 h-5" />
                Copiar Código
              </>
            )}
          </Button>

          <div className="pt-2 space-y-2">
            <div className="p-3 rounded-lg border bg-muted/50 border-muted-foreground/10">
              <p className="text-xs leading-relaxed text-center sm:text-sm text-muted-foreground">
                💡 Tip: Podés enviar el código por WhatsApp o mostrarle la
                pantalla directamente
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground/70">
              Esta pantalla se actualizará automáticamente cuando te agreguen al
              equipo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
