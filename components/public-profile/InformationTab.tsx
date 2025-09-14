import { Separator } from "@/components/ui/separator";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  ReadOnlyScheduleView,
  WorkingHoursWithBlocks,
} from "@/components/schedule/ReadOnlyScheduleView";
import { MapPin } from "lucide-react";

interface InformationTabProps {
  description: string | null;
  address: string | null;
  whatsappUrl: string | null;
  workingHours: WorkingHoursWithBlocks[];
}

export function InformationTab({
  description,
  address,
  whatsappUrl,
  workingHours,
}: InformationTabProps) {
  return (
    <div className="p-6">
      <div className="flex flex-row items-center justify-center gap-2 mb-2">
        {address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{address}</span>
          </div>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 transition-colors rounded-full text-primary hover:bg-muted"
            aria-label="Contactar por WhatsApp"
          >
            <WhatsAppIcon className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Contactar
            </span>
          </a>
        )}
      </div>

      {description && (
        <p className="text-sm text-center text-muted-foreground">
          {description}
        </p>
      )}

      <Separator className="my-4" />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-center">
          Nuestros Horarios
        </h3>
        <ReadOnlyScheduleView workingHours={workingHours} />
      </div>
    </div>
  );
}
