"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Role, Service } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, User } from "lucide-react";
import ServiceList from "@/components/ServiceList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GroupedService } from "./page";

const AddServiceModalContent = dynamic(
  () =>
    import("@/components/AddServiceModal").then(
      (mod) => mod.AddServiceModalContent
    ),
  { ssr: false }
);

function ModalContentSkeleton() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <Skeleton className="w-48 h-6" />
        </DialogTitle>
        <DialogDescription>
          <Skeleton className="w-full h-4" />
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="w-full h-20" />
        </div>
      </div>
      <DialogFooter>
        <Skeleton className="w-24 h-10" />
        <Skeleton className="w-32 h-10" />
      </DialogFooter>
    </>
  );
}

interface ServicesClientProps {
  userId: string;
  userRole: Role;
  initialServices: Service[];
  initialGroupedServices: GroupedService[];
  teamsEnabled: boolean;
}

export function ServicesClient({
  userId,
  userRole,
  initialServices,
  initialGroupedServices,
  teamsEnabled,
}: ServicesClientProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto border-2">
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Mis Servicios</CardTitle>
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Servicio
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {userRole === Role.OWNER && teamsEnabled ? (
            <div className="space-y-8">
              {initialGroupedServices.map(
                ({ barberId, barberName, services }) => (
                  <div key={barberId} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border">
                        <User className="w-4 h-4 text-primary" />
                        <h3 className="text-base font-semibold">
                          {barberName}
                          {barberId === userId && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (vos)
                            </span>
                          )}
                        </h3>
                      </div>
                      <Separator className="flex-1" />
                    </div>

                    <ServiceList services={services} />
                  </div>
                )
              )}
            </div>
          ) : (
            <ServiceList services={initialServices} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {isModalOpen && (
            <Suspense fallback={<ModalContentSkeleton />}>
              <AddServiceModalContent onClose={() => setModalOpen(false)} />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
