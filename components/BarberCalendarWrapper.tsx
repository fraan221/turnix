"use client";

import dynamic from "next/dynamic";
import BarberCalendarSkeleton from "./BarberCalendarSkeleton";

const BarberCalendarWrapper = dynamic(() => import("./BarberCalendar"), {
  ssr: false,
  loading: () => <BarberCalendarSkeleton />,
});

export default BarberCalendarWrapper;
