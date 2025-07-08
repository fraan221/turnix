"use client";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg } from '@fullcalendar/core';
import { Booking, Service, Client } from '@prisma/client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { createBooking } from '@/actions/dashboard.actions';
import { useWindowSize } from '@/lib/hooks';

type BookingWithDetails = Booking & {
  service: Service;
  client: Client;
};

interface BarberCalendarProps {
  bookings: BookingWithDetails[];
  services: Service[];
}

export default function BarberCalendar({ bookings, services }: BarberCalendarProps) {
  const [open, setOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
  
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const events = bookings.map(booking => {
    const endTime = new Date(booking.startTime.getTime() + (booking.service.durationInMinutes || 0) * 60000);
    return {
      id: booking.id,
      title: `${booking.service.name} - ${booking.client.name}`,
      start: booking.startTime,
      end: endTime,
      extendedProps: {
        clientName: booking.client.name,
        clientPhone: booking.client.phone,
        servicePrice: booking.service.price,
      }
    };
  });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateInfo(selectInfo);
    setOpen(true);
  };

  const initialView = isMobile ? 'timeGridDay' : 'timeGridWeek';
  const headerToolbarConfig = isMobile 
    ? {
        left: 'prev,next',
        center: 'title',
        right: 'today'
      }
    : {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      };

  return (
    <div className="p-2 bg-white border rounded-lg border-black/15 md:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={headerToolbarConfig}
        events={events}
        editable={true}
        selectable={true}
        select={handleDateSelect}
        allDaySlot={false}
        locale="es"
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
        }}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="23:00:00"
        contentHeight="auto"
        nowIndicator={true}
        titleFormat={{ year: 'numeric', month: 'long' }}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          omitZeroMinute: false,
          meridiem: false,
          hour12: false,
        }}
        slotLabelContent={(arg) => {
          return `${arg.text} hs`;
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Turno</DialogTitle>
          </DialogHeader>
          <form action={async (formData) => {
              await createBooking(formData);
              setOpen(false);
            }} className="space-y-4">
            
            <input type="hidden" name="startTime" value={selectedDateInfo?.startStr || ''} />

            <div>
              <Label htmlFor="clientName">Nombre del Cliente</Label>
              <Input id="clientName" name="clientName" required />
            </div>
            <div>
              <Label htmlFor="clientPhone">Teléfono del Cliente</Label>
              <Input id="clientPhone" name="clientPhone" required />
            </div>
            <div>
              <Label htmlFor="serviceId">Servicio</Label>
              <Select name="serviceId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} (${service.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Agendar Turno</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}