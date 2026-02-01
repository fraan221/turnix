import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Service } from "@prisma/client";

/**
 * Booking Store for the public booking wizard.
 * Persists booking state to handle payment redirects back from Mercado Pago.
 */

interface BookingState {
  // Selected values
  barberId: string | null;
  services: Service[];
  dateTime: Date | null;
  clientName: string;
  clientPhone: string;

  // Pending booking for payment flow
  pendingBookingId: string | null;
  depositAmount: number | null;

  // Hydration flag
  isHydrated: boolean;
}

interface BookingActions {
  setBarber: (id: string) => void;
  setServices: (services: Service[]) => void;
  setDateTime: (date: Date) => void;
  setClientInfo: (name: string, phone: string) => void;
  setPendingBooking: (id: string, depositAmount: number) => void;
  setHydrated: () => void;
  reset: () => void;
}

type BookingStore = BookingState & BookingActions;

const initialState: BookingState = {
  barberId: null,
  services: [],
  dateTime: null,
  clientName: "",
  clientPhone: "",
  pendingBookingId: null,
  depositAmount: null,
  isHydrated: false,
};

export const useBookingStore = create<BookingStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setBarber: (id: string) => {
          set({ barberId: id }, false, "setBarber");
        },

        setServices: (services: Service[]) => {
          set({ services }, false, "setServices");
        },

        setDateTime: (date: Date) => {
          set({ dateTime: date }, false, "setDateTime");
        },

        setClientInfo: (name: string, phone: string) => {
          set({ clientName: name, clientPhone: phone }, false, "setClientInfo");
        },

        setPendingBooking: (id: string, depositAmount: number) => {
          set(
            { pendingBookingId: id, depositAmount },
            false,
            "setPendingBooking",
          );
        },

        setHydrated: () => {
          set({ isHydrated: true }, false, "setHydrated");
        },

        reset: () => {
          set(initialState, false, "reset");
        },
      }),
      {
        name: "turnix-booking-store",
        // Only persist the pending booking info for payment redirect
        partialize: (state) => ({
          pendingBookingId: state.pendingBookingId,
          depositAmount: state.depositAmount,
          clientName: state.clientName,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated();
        },
      },
    ),
    { name: "BookingStore" },
  ),
);

// Selectors
export const selectPendingBooking = (state: BookingStore) => ({
  id: state.pendingBookingId,
  depositAmount: state.depositAmount,
});

export const selectClientInfo = (state: BookingStore) => ({
  name: state.clientName,
  phone: state.clientPhone,
});

export const selectIsHydrated = (state: BookingStore) => state.isHydrated;
