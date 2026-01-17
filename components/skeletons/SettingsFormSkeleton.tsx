"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function NavSkeleton() {
  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:block shrink-0 w-56">
        <ul className="space-y-1">
          {/* Active item */}
          <li>
            <div className="flex gap-3 items-center px-3 py-2 rounded-md bg-accent">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-14 h-4" />
            </div>
          </li>
          {/* Regular items */}
          {[...Array(3)].map((_, i) => (
            <li key={i}>
              <div className="flex gap-3 items-center px-3 py-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
            </li>
          ))}
          {/* Disabled items with badge */}
          {[...Array(2)].map((_, i) => (
            <li key={`disabled-${i}`}>
              <div className="flex gap-3 items-center px-3 py-2 opacity-50">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="flex-1 w-16 h-4" />
                <Skeleton className="w-12 h-4 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile nav */}
      <nav className="-mx-4 mb-6 border-b md:hidden">
        <div className="flex overflow-x-auto gap-2 px-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-2 items-center px-4 py-3 shrink-0">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

function PersonalInfoSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex gap-3 items-center">
          <Skeleton className="p-2 w-10 h-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-48 h-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile photo section */}
        <div className="flex gap-6 items-start">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-full h-10 rounded-md" />
            <Skeleton className="w-40 h-3" />
          </div>
        </div>

        {/* Nombre completo */}
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-full h-10 rounded-md" />
        </div>

        {/* Número de celular */}
        <div className="space-y-2">
          <Skeleton className="w-36 h-4" />
          <Skeleton className="w-full h-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsFormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="mt-2 w-96 h-5" />
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row md:gap-8">
        <NavSkeleton />
        <div className="flex-1 min-w-0">
          <PersonalInfoSkeleton />
        </div>
      </div>

      {/* Floating save button */}
      <div className="fixed right-8 bottom-8">
        <Skeleton className="w-40 h-10 rounded-md" />
      </div>
    </div>
  );
}
