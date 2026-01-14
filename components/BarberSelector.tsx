"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

interface BarberSelectorProps {
  teamMembers: { id: string; name: string }[];
  selectedBarberId: string;
  compact?: boolean;
}

export function BarberSelector({
  teamMembers,
  selectedBarberId,
  compact = false,
}: BarberSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (teamMembers.length <= 1) return null;

  const handleBarberChange = (newBarberId: string) => {
    const params = new URLSearchParams(searchParams);

    if (newBarberId === teamMembers[0]?.id) {
      params.delete("barberId");
    } else {
      params.set("barberId", newBarberId);
    }

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "/dashboard");
  };

  const selectedMember = teamMembers.find((m) => m.id === selectedBarberId);

  if (compact) {
    return (
      <Select value={selectedBarberId} onValueChange={handleBarberChange}>
        <SelectTrigger className="gap-2 px-3 w-auto h-9 text-sm border-dashed bg-background">
          <Users className="w-4 h-4 shrink-0 text-muted-foreground" />
          <SelectValue>
            <span className="max-w-[100px] truncate sm:max-w-[150px]">
              {selectedMember?.name?.replace(" (Tú)", "") || "Barbero"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex gap-3 justify-center items-center p-3 mx-auto mb-4 max-w-7xl rounded-lg border bg-muted/30">
      <div className="flex gap-2 items-center text-sm font-medium text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>Viendo agenda de:</span>
      </div>
      <Select value={selectedBarberId} onValueChange={handleBarberChange}>
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Seleccionar barbero">
            {selectedMember?.name || "Seleccionar barbero"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
