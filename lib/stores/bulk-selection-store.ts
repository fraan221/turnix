import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Bulk Selection Store for the calendar bulk confirmation feature.
 * Manages selection mode and selected booking IDs for bulk operations.
 */

interface BulkSelectionState {
  isSelectionMode: boolean;
  selectedBookingIds: Set<string>;
  selectedDate: string | null;
}

interface BulkSelectionActions {
  enterSelectionMode: () => void;
  enterSelectionModeForDate: (date: string) => void;
  exitSelectionMode: () => void;
  toggleBooking: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

type BulkSelectionStore = BulkSelectionState & BulkSelectionActions;

export const useBulkSelectionStore = create<BulkSelectionStore>()(
  devtools(
    (set) => ({
      isSelectionMode: false,
      selectedBookingIds: new Set(),
      selectedDate: null,

      enterSelectionMode: () =>
        set({ isSelectionMode: true }, false, "enterSelectionMode"),

      enterSelectionModeForDate: (date) =>
        set(
          {
            isSelectionMode: true,
            selectedBookingIds: new Set(),
            selectedDate: date,
          },
          false,
          "enterSelectionModeForDate",
        ),

      exitSelectionMode: () =>
        set(
          {
            isSelectionMode: false,
            selectedBookingIds: new Set(),
            selectedDate: null,
          },
          false,
          "exitSelectionMode",
        ),

      toggleBooking: (id) =>
        set(
          (state) => {
            const newSet = new Set(state.selectedBookingIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return { selectedBookingIds: newSet };
          },
          false,
          "toggleBooking",
        ),

      selectAll: (ids) =>
        set({ selectedBookingIds: new Set(ids) }, false, "selectAll"),

      clearSelection: () =>
        set({ selectedBookingIds: new Set() }, false, "clearSelection"),
    }),
    { name: "BulkSelectionStore" },
  ),
);

// Selectors - granular subscriptions to avoid unnecessary re-renders
export const selectIsSelectionMode = (state: BulkSelectionStore) =>
  state.isSelectionMode;

export const selectSelectedCount = (state: BulkSelectionStore) =>
  state.selectedBookingIds.size;

export const selectIsSelected = (id: string) => (state: BulkSelectionStore) =>
  state.selectedBookingIds.has(id);

export const selectSelectedBookingIds = (state: BulkSelectionStore) =>
  state.selectedBookingIds;

export const selectSelectedDate = (state: BulkSelectionStore) =>
  state.selectedDate;
