"use client";

import { useState, useEffect } from "react";
import Slide from "./Slide";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import QrCodeGenerator from "./QrCode";

const slidesContent = [
  {
    type: "INTRO",
    title: "Introducción",
  },
  {
    type: "PROBLEM",
    title: "¿Te suena familiar?",
    problems: [
      {
        emoji: "📱",
        text: "WhatsApp que no para de sonar",
      },
      {
        emoji: "💸",
        text: "Clientes que faltan sin avisar",
      },
      {
        emoji: "⏰",
        text: "Horas perdidas organizando turnos",
      },
    ],
  },
  {
    type: "SOLUTION",
    title: "Turnix resuelve esto",
    benefits: [
      "Tu agenda se llena sola, 24/7",
      "Recordatorios automáticos = menos ausencias",
      "Más tiempo para cortar, menos tiempo gestionando",
    ],
  },
  {
    type: "OFFER",
    title: "Oferta Exclusiva del Evento",
    subtitle: "Solo para los asistentes de hoy",
    originalPrice: 9900,
    finalPrice: 7920,
    discount: "20% OFF",
  },
  {
    type: "QR",
    title: "Probá gratis por 14 días",
    subtitle: "Escaneá el código y empezá ahora",
    qrValue: "https://turnix.app/register",
  },
  {
    type: "FINAL",
    title: "¿Hablamos?",
    subtitle: "Estamos para ayudarte a hacer crecer tu barbería",
    contact: "+54 9 11 6054-2164",
  },
];

export default function PresentationClient() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slidesContent.length;

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goToNextSlide();
      if (event.key === "ArrowLeft") goToPreviousSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  if (!isMounted) {
    return null;
  }

  const activeSlide = slidesContent[currentSlide];

  const renderSlideContent = () => {
    switch (activeSlide.type) {
      case "INTRO":
        return (
          <div className="flex flex-col items-center justify-center space-y-8">
            <Image
              src="/logo.png"
              alt="Turnix Logo"
              width={200}
              height={200}
              className="rounded-3xl"
            />
            <h1 className="text-6xl font-bold text-gray-400 font-heading">
              {activeSlide.title}
            </h1>
          </div>
        );

      case "PROBLEM":
        return (
          <div className="space-y-16">
            <h1 className="font-bold text-7xl font-heading">
              {activeSlide.title}
            </h1>
            <div className="grid gap-8">
              {activeSlide.problems?.map((problem, index) => (
                <div
                  key={index}
                  className="flex items-center gap-6 p-8 border-l-8 rounded-lg bg-white/5 border-primary"
                >
                  <span className="text-6xl">{problem.emoji}</span>
                  <p className="text-4xl font-medium">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "SOLUTION":
        return (
          <div className="space-y-16">
            <h1 className="font-bold text-7xl font-heading text-primary">
              {activeSlide.title}
            </h1>
            <div className="space-y-6">
              {activeSlide.benefits?.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-lg bg-primary/10"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 bg-primary">
                    <span className="text-2xl font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-3xl font-medium leading-relaxed">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "OFFER":
        return (
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="inline-block px-6 py-3 text-3xl font-bold text-white rounded-full bg-primary">
                {activeSlide.discount}
              </div>
              <h1 className="text-6xl font-bold font-heading">
                {activeSlide.title}
              </h1>
              <p className="text-2xl text-gray-300">{activeSlide.subtitle}</p>
            </div>

            <div className="inline-block p-12 space-y-6 bg-white rounded-2xl">
              <div className="space-y-2">
                <p className="text-2xl text-gray-500 line-through">
                  ${activeSlide.originalPrice?.toLocaleString("es-AR")}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-gray-900 text-7xl">
                    ${activeSlide.finalPrice?.toLocaleString("es-AR")}
                  </span>
                  <span className="text-3xl font-semibold text-gray-600">
                    /mes
                  </span>
                </div>
              </div>
              <p className="text-xl text-gray-600">
                Precio exclusivo para asistentes al evento
              </p>
            </div>
          </div>
        );

      case "QR":
        return (
          <div className="space-y-12">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold font-heading">
                {activeSlide.title}
              </h1>
              <p className="text-3xl text-gray-300">{activeSlide.subtitle}</p>
            </div>
            {activeSlide.qrValue && (
              <div className="inline-block p-8 bg-white rounded-2xl">
                <QrCodeGenerator value={activeSlide.qrValue} />
              </div>
            )}
            <p className="text-2xl text-gray-400">
              Sin tarjeta • Setup en 15 minutos
            </p>
          </div>
        );

      case "FINAL":
        return (
          <div className="space-y-12">
            <h1 className="font-bold text-8xl font-heading">
              {activeSlide.title}
            </h1>
            <p className="text-4xl text-gray-300">{activeSlide.subtitle}</p>
            <div className="inline-block px-12 py-6 text-3xl font-bold text-white rounded-xl bg-primary">
              WhatsApp: {activeSlide.contact}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <div key={currentSlide} className="fade-in">
        <Slide>{renderSlideContent()}</Slide>
      </div>

      <div className="fixed flex items-center gap-4 bottom-8 right-8">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousSlide}
          className="w-12 h-12"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="text-xl font-semibold">
          {currentSlide + 1} / {totalSlides}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextSlide}
          className="w-12 h-12"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
