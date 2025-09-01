import { User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface TeamListProps {
  teamMembers: Pick<User, "id" | "name" | "email" | "image">[];
}

export function TeamList({ teamMembers }: TeamListProps) {
  return (
    <>
      {teamMembers.length > 0 ? (
        <ul className="space-y-4">
          {teamMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center w-auto gap-4">
                <Avatar>
                  <AvatarImage
                    src={member.image ?? ""}
                    alt={member.name ?? "Avatar del barbero"}
                  />
                  <AvatarFallback>
                    {member.name?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>
              {/* TODO: Futura implementación de acciones por miembro.
                  Aquí irá un DropdownMenu con opciones como "Eliminar del equipo".
                */}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
          <Users className="w-12 h-12 text-muted-foreground" />
          <p className="mt-4 font-semibold">Tu equipo está vacío</p>
          <p className="text-sm text-muted-foreground">
            Usa el botón "+ Añadir barbero" para empezar a invitar miembros.
          </p>
        </div>
      )}
    </>
  );
}
