"use client";

import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Clock, Scissors, Eye, ArrowRight, CheckCircle2, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { completeOnboarding } from '@/actions/dashboard.actions';
import { useFormStatus } from 'react-dom';

interface OnboardingCardProps {
  userSlug: string | null;
  hasWorkingHours: boolean;
  hasServices: boolean;
  hasSlug: boolean;
}

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
      {pending ? "Finalizando..." : (
        <>
          <PartyPopper className="w-5 h-5 mr-2" />
          Finalizar Tutorial
        </>
      )}
    </Button>
  );
}

export default function OnboardingCard({ userSlug, hasWorkingHours, hasServices, hasSlug }: OnboardingCardProps) {
  
  const allStepsCompleted = hasWorkingHours && hasServices && hasSlug;

  const steps = [
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: '1. Define tus Horarios de Trabajo',
      description: 'Configura qué días y horas trabajas.',
      href: '/dashboard/schedule',
      cta: 'Definir Horarios',
      isDone: hasWorkingHours,
    },
    {
      icon: <Scissors className="w-6 h-6 text-primary" />,
      title: '2. Añade un Servicio',
      description: 'Crea los servicios que ofreces (ej: "Corte", "Corte y Barba").',
      href: '/dashboard/services',
      cta: 'Crear Servicio',
      isDone: hasServices,
    },
    {
      icon: <Eye className="w-6 h-6 text-primary" />,
      title: '3. Configura tu URL Pública',
      description: `Define tu enlace personalizado (ej: turnix.app/tu-barberia).`,
      href: '/dashboard/settings',
      cta: 'Ir a Ajustes',
      isDone: hasSlug,
    },
  ];

  const handleFinish = async () => {
    const result = await completeOnboarding();
    if (result.success) {
      toast.success("¡Felicitaciones! Configuración completada.", {
        description: "Tu barbería ya está lista para recibir reservas.",
        icon: <PartyPopper className="w-6 h-6 text-green-500" />,
        duration: 6000,
      });
    } else {
      toast.error("Hubo un error", {
        description: result.error || "No se pudo finalizar el tutorial. Inténtalo de nuevo."
      });
    }
  };

  return (
    <Card className="mb-8 overflow-hidden border-2 shadow-lg border-primary/50">
      <CardHeader>
        <CardTitle className="text-2xl">¡Bienvenido a Turnix! 👋</CardTitle>
        <CardDescription>
          Completa los siguientes pasos para dejar tu barbería lista para recibir turnos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className={cn(
                "flex flex-col items-start gap-4 p-4 transition-all border rounded-lg",
                step.isDone && "bg-green-50/50 border-green-200"
              )}
            >
              <div className="flex items-start w-full gap-4">
                <div className={cn(
                    "flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10",
                    step.isDone && "bg-green-100"
                  )}>
                  {step.isDone ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : step.icon}
                </div>
                <div className="flex flex-col items-start gap-2">
                  <h3 className={cn("font-semibold", step.isDone && "text-gray-500 line-through")}>{step.title}</h3>
                  <p className="text-sm text-muted-foreground sm:pl-0 sm:flex-1">{step.description}</p>
                  <div>
                    {!step.isDone && (
                    <div className="w-full sm:w-auto">
                        <Link href={step.href} passHref legacyBehavior>
                          <Button variant="outline" asChild className="w-full sm:w-auto">
                          <a>
                              {step.cta}
                              <ArrowRight className="w-4 h-4 ml-2" />
                          </a>
                          </Button>
                        </Link>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {allStepsCompleted && (
        <CardFooter className="flex-col items-start gap-4 p-4 border-t bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-lg font-semibold">¡Todo listo!</span>
          </div>
          <form action={handleFinish}>
            <FinishButton />
          </form>
        </CardFooter>
      )}
    </Card>
  );
}