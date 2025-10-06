"use client";

import { useState, useEffect } from "react";
import Slide from "./Slide";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import QrCodeGenerator from "./QrCode";

const slidesContent = [
  { type: "INTRO", title: "Introducción" },
  {
    type: "AGENDA",
    title: "Temario",
    items: [
      "Cómo crear tu cuenta",
      "Cómo crear servicios",
      "Configurar horarios de trabajo",
      "Uso de la Agenda",
      "Optimizar tu perfil público (SEO)",
      "Cómo reservan tus clientes",
    ],
  },
  {
    type: "DEMO_SECTION",
    title: "1. Crear tu cuenta",
    subtitle: "Registrate en menos de 3 minutos",
  },
  {
    type: "DEMO_SECTION",
    title: "2. Crear servicios",
    subtitle: "Corte, Corte y Barba, etc...",
  },
  {
    type: "DEMO_SECTION",
    title: "3. Configurar horarios",
    subtitle: "Cuándo trabajás y cuándo no",
  },
  {
    type: "DEMO_SECTION",
    title: "4. Uso de la Agenda",
    subtitle: "Gestioná tus turnos día a día",
  },
  {
    type: "DEMO_SECTION",
    title: "5. Optimizar tu perfil",
    subtitle: "Mejorá tu visibilidad en Google",
  },
  {
    type: "DEMO_SECTION",
    title: "6. Reservas de clientes",
    subtitle: "Así tus clientes pueden reservar",
  },
  {
    type: "OFFER",
    title: "COLORES LOKOS 3",
    subtitle: "Codigo valido Domingo y Lunes",
    originalPrice: 9900,
    finalPrice: 7900,
    discount: "20% OFF",
    discountCode: "COLORESLOKOS3",
  },
  {
    type: "QR",
    title: "Registrate ahora",
    subtitle: "Escaneá y aprovecha la oferta",
    qrValue: "https://turnix.app/register",
  },
  {
    type: "FINAL",
    title: "GRACIAS",
    subtitle: "TURNIX",
  },
] as const;

type SlideItem = (typeof slidesContent)[number];

export default function PresentationClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [current, setCurrent] = useState(0);
  const total = slidesContent.length;

  const next = () => setCurrent((p) => (p + 1) % total);
  const prev = () => setCurrent((p) => (p - 1 + total) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  if (!mounted) return null;

  const slide = slidesContent[current];

  function renderContent(item: SlideItem) {
    switch (item.type) {
      case "INTRO":
        return (
          <div className="flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <div
                className="absolute inset-0 blur-3xl opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, var(--accent) 0%, var(--brand) 50%, transparent 70%)",
                }}
              />
              <Image
                src="/logo.png"
                alt="Turnix"
                width={200}
                height={200}
                className="relative shadow-2xl rounded-3xl"
                style={{ boxShadow: "0 20px 60px rgba(157,0,255,.40)" }}
              />
            </div>
            <h1 className="font-extrabold text-7xl font-heading brand-text glow-xl">
              {item.title}
            </h1>
          </div>
        );

      case "AGENDA":
        return (
          <div className="space-y-10">
            <h2 className="text-6xl font-extrabold font-heading brand-text">
              {item.title}
            </h2>
            <div className="grid gap-5">
              {item.items?.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 p-6 rounded-xl transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(157,0,255,.06) 0%, rgba(255,0,229,.10) 100%)",
                    borderLeft: "4px solid",
                    borderImage:
                      "linear-gradient(180deg, var(--brand), var(--accent)) 1",
                    boxShadow: "0 4px 20px rgba(157,0,255,.15)",
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full shadow-lg w-14 h-14 shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)",
                      boxShadow: "0 8px 20px rgba(255,0,229,.40)",
                    }}
                  >
                    <span className="text-2xl font-extrabold">{i + 1}</span>
                  </div>
                  <p className="text-3xl font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "DEMO_SECTION":
        return (
          <div className="flex flex-col items-center justify-center gap-10">
            <div className="space-y-5 text-center">
              <h3
                className="text-6xl font-extrabold md:text-7xl font-heading"
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent) 0%, var(--brand) 50%, var(--accent) 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "gradient 3s ease infinite",
                }}
              >
                {item.title}
              </h3>
              <p
                className="text-3xl font-light md:text-4xl"
                style={{
                  color: "#E500FF",
                  textShadow: "0 0 30px rgba(229,0,255,.5)",
                }}
              >
                {item.subtitle}
              </p>
            </div>
            <div
              className="flex px-10 py-5 mt-4 text-2xl font-bold transition-transform cursor-pointer rounded-xl hover:scale-110"
              style={{
                background:
                  "linear-gradient(135deg, var(--deep) 0%, var(--mid) 100%)",
                border: "2px solid transparent",
                backgroundImage: `linear-gradient(135deg, var(--deep) 0%, var(--mid) 100%), linear-gradient(135deg, var(--accent) 0%, var(--brand) 100%)`,
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                color: "#FFFFFF",
                boxShadow: "0 10px 40px rgba(157,0,255,.30)",
              }}
            >
              <Play className="w-8 h-8 mr-2" /> Demo en vivo
            </div>
          </div>
        );

      case "OFFER":
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <div
                className="inline-block px-8 py-3 text-3xl font-black text-white rounded-full animate-bounce"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent) 0%, var(--brand) 100%)",
                  boxShadow: "0 15px 40px rgba(255,0,229,.5)",
                }}
              >
                🔥 {item.discount}
              </div>
              <h4 className="text-6xl font-extrabold font-heading">
                {item.title}
              </h4>
              <p
                className="text-2xl"
                style={{
                  color: "#E500FF",
                  textShadow: "0 0 20px rgba(229,0,255,.5)",
                }}
              >
                {item.subtitle}
              </p>
            </div>

            <div
              className="inline-block p-10 space-y-8 rounded-2xl"
              style={{
                background:
                  "linear-gradient(145deg, #1A0329 0%, #2D0845 50%, #4A0E6B 100%)",
                border: "3px solid",
                borderImage:
                  "linear-gradient(135deg, var(--brand), var(--accent)) 1",
                boxShadow:
                  "0 0 50px rgba(157,0,255,.20), inset 0 0 30px rgba(255,0,229,.10)",
              }}
            >
              <div className="space-y-3">
                <p
                  className="text-2xl line-through opacity-60"
                  style={{ color: "#B300FF" }}
                >
                  ${item.originalPrice?.toLocaleString("es-AR")}
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-black text-7xl md:text-8xl"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent) 0%, #E500FF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 0 20px rgba(255,0,229,.50))",
                    }}
                  >
                    ${item.finalPrice?.toLocaleString("es-AR")}
                  </span>
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "#B300FF" }}
                  >
                    /3 meses
                  </span>
                </div>
              </div>

              <div
                className="pt-6 space-y-4"
                style={{
                  borderTop: "2px solid",
                  borderImage:
                    "linear-gradient(90deg, transparent, var(--brand), transparent) 1",
                }}
              >
                <p className="text-xl font-medium" style={{ color: "#E500FF" }}>
                  💎 Con el codigo 💎
                </p>
                <div
                  className="px-8 py-5 font-mono text-3xl font-black tracking-wider text-center rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,0,229,.15), rgba(157,0,255,.15))",
                    border: "2px dashed var(--accent)",
                    color: "#FFFFFF",
                    textShadow: "0 0 20px rgba(255,0,229,.8)",
                  }}
                >
                  {item.discountCode}
                </div>
              </div>
            </div>
          </div>
        );

      case "QR":
        return (
          <div className="space-y-10">
            <div className="space-y-3">
              <h5 className="text-6xl font-extrabold font-heading brand-text">
                {item.title}
              </h5>
              <p
                className="text-3xl"
                style={{
                  color: "#B300FF",
                  textShadow: "0 0 20px rgba(179,0,255,.40)",
                }}
              >
                {item.subtitle}
              </p>
            </div>
            {item.qrValue && (
              <div
                className="relative inline-block p-10 rounded-3xl"
                style={{
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F0F0FF 100%)",
                  boxShadow:
                    "0 0 60px rgba(157,0,255,.40), 0 0 120px rgba(255,0,229,.20)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-30 rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), var(--brand))",
                    filter: "blur(40px)",
                  }}
                />
                <div className="relative">
                  <QrCodeGenerator value={item.qrValue} />
                </div>
              </div>
            )}
          </div>
        );

      case "FINAL":
        return (
          <div className="space-y-10">
            <h6
              className="font-black text-7xl md:text-8xl font-heading"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent) 0%, var(--brand) 25%, #E500FF 50%, var(--brand) 75%, var(--accent) 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradient 4s ease infinite",
                filter: "drop-shadow(0 0 30px rgba(255,0,229,.50))",
              }}
            >
              {item.title}
            </h6>
            <p
              className="text-4xl font-light"
              style={{
                color: "#B300FF",
                textShadow: "0 0 25px rgba(179,0,255,.50)",
              }}
            >
              {item.subtitle}
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .brand-text {
          background-image: linear-gradient(90deg, var(--accent), var(--brand));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .brand-gradient {
          background-image: linear-gradient(
            90deg,
            var(--accent),
            var(--brand),
            #e500ff
          );
        }
        .glow-xl {
          filter: drop-shadow(0 0 25px rgba(255, 0, 229, 0.45));
        }
      `}</style>

      <div key={current} className="fade-in">
        <Slide>{renderContent(slide)}</Slide>
      </div>

      <div className="fixed flex items-center gap-6 bottom-8 right-8">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          className="transition-transform w-14 h-14 hover:scale-110"
          style={{
            background: "linear-gradient(135deg, var(--deep), var(--mid))",
            border: "2px solid var(--brand)",
            boxShadow: "0 8px 25px rgba(157,0,255,.30)",
          }}
        >
          <ChevronLeft className="w-7 h-7" style={{ color: "var(--accent)" }} />
        </Button>

        <span
          className="px-6 py-2 text-2xl font-bold rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(157,0,255,.10), rgba(255,0,229,.10))",
            border: "1px solid var(--brand)",
            color: "var(--accent)",
            textShadow: "0 0 10px rgba(255,0,229,.50)",
          }}
        >
          {current + 1} / {total}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={next}
          className="transition-transform w-14 h-14 hover:scale-110"
          style={{
            background: "linear-gradient(135deg, var(--deep), var(--mid))",
            border: "2px solid var(--brand)",
            boxShadow: "0 8px 25px rgba(157,0,255,.30)",
          }}
        >
          <ChevronRight
            className="w-7 h-7"
            style={{ color: "var(--accent)" }}
          />
        </Button>
      </div>
    </div>
  );
}
