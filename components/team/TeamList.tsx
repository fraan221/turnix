"use client";

import { User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Users, Loader2, Mail, Crown } from "lucide-react";
import { useState, useTransition } from "react";
import { removeTeamMember } from "@/actions/team.actions";
import { toast } from "sonner";

interface TeamListProps {
  teamMembers: Pick<User, "id" | "name" | "email" | "image">[];
  ownerId: string;
}

export function TeamList({ teamMembers, ownerId }: TeamListProps) {
  const [isPending, startTransition] = useTransition();
  const [memberToDelete, setMemberToDelete] = useState<Pick<
    User,
    "id" | "name"
  > | null>(null);

  const handleRemoveClick = (member: Pick<User, "id" | "name">) => {
    setMemberToDelete(member);
  };

  const handleConfirmRemove = () => {
    if (!memberToDelete) return;

    const formData = new FormData();
    formData.append("memberId", memberToDelete.id);

    startTransition(async () => {
      const result = await removeTeamMember(formData);
      if (result.success) {
        toast.success(result.success);
      } else if (result.error) {
        toast.error(result.error);
      }
      setMemberToDelete(null);
    });
  };

  if (teamMembers.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
        <Users className="w-12 h-12 text-muted-foreground" />
        <p className="mt-4 font-semibold">Tu equipo está vacío</p>
        <p className="text-sm text-muted-foreground">
          Usa el botón "+ Añadir barbero" para empezar a invitar miembros.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {teamMembers.map((member) => {
          const isOwner = member.id === ownerId;

          return (
            <div
              key={member.id}
              className="relative p-4 transition-colors border rounded-lg bg-card hover:border-primary/50"
            >
              {/* Badge de dueño en esquina superior derecha */}
              {isOwner && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="w-3 h-3" />
                    Dueño
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage
                    src={member.image ?? ""}
                    alt={member.name ?? "Avatar del barbero"}
                  />
                  <AvatarFallback className="text-lg">
                    {member.name?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{member.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>

              {/* Botón de eliminar */}
              {!isOwner && (
                <div className="pt-4 mt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveClick(member)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar del equipo
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={() => setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar del equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a{" "}
              <span className="font-semibold">{memberToDelete?.name}</span> de
              tu equipo. Esta persona perderá acceso a la barbería y no podrá
              gestionar su agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
