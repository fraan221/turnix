import { Suspense } from "react";
import { preloadRecurringBookings, getCurrentUserWithBarbershop, getRecurringBookings } from "@/lib/data";
import { FixedBookingsList } from "@/components/fixed/FixedBookingsList";
import { FixedBookingsListSkeleton } from "@/components/skeletons/FixedBookingsListSkeleton";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Turnos Fijos | Turnix",
  description: "Gestioná los turnos recurrentes de tus clientes.",
};

export default async function FixedBookingsPage() {
  const user = await getCurrentUserWithBarbershop();
  
  if (!user) {
    redirect("/login");
  }

  const barbershopId = user.ownedBarbershop?.id || user.teamMembership?.barbershopId;
  
  if (!barbershopId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">
          No tenés acceso a una barbería para gestionar turnos fijos.
        </p>
      </div>
    );
  }

  // Preload pattern
  preloadRecurringBookings(barbershopId);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Turnos Fijos</h1>
        <p className="text-muted-foreground">
          Gestioná las reservas automáticas y recurrentes de tus clientes frecuentes.
        </p>
      </div>

      <Suspense fallback={<FixedBookingsListSkeleton />}>
        <FixedBookingsLoader barbershopId={barbershopId} role={user.role} userId={user.id} />
      </Suspense>
    </div>
  );
}

async function FixedBookingsLoader({ 
  barbershopId, 
  role,
  userId 
}: { 
  barbershopId: string; 
  role: string | null;
  userId: string;
}) {
  const [fixedBookings, clients, services, barbers] = await Promise.all([
    getRecurringBookings(barbershopId),
    prisma.client.findMany({ 
      where: { barbershopId }, 
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true }
    }),
    prisma.service.findMany({ 
      where: { barbershopId }, 
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { ownedBarbershop: { id: barbershopId } },
          { teamMembership: { barbershopId } }
        ]
      },
      select: { id: true, name: true }
    })
  ]);
  
  // Si el usuario es barbero, solo le mostramos sus propios turnos fijos
  const filteredBookings = role === "OWNER" 
    ? fixedBookings 
    : fixedBookings.filter((b: any) => b.barberId === userId);

  return (
    <FixedBookingsList 
      initialBookings={filteredBookings} 
      role={role} 
      clients={clients} 
      services={services}
      barbers={barbers}
    />
  );
}
