import React from "react";

interface SlideProps {
  children: React.ReactNode;
}

export default function Slide({ children }: SlideProps) {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen p-8 text-center">
      {children}
    </div>
  );
}
