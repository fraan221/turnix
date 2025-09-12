"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Users, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const benefits = [
  {
    icon: <CalendarClock className="w-8 h-8 text-primary" />,
    title: "Tu agenda se llena sola",
    description:
      "Los clientes reservan 24/7, te envian un mensaje con el turno y vos solo te preocupás por cortar. Se acabaron los 'me olvidé'.",
    businessImpact: "Más turnos, menos gestión.",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Equipo organizado",
    description:
      "Cada barbero ve su propia agenda, gestiona sus servicios y tiene una visualizacion completa de los clientes del local. Cada miembro es independiente.",
    businessImpact: "Menos confusiones, más productividad.",
  },
  {
    icon: <LineChart className="w-8 h-8 text-primary" />,
    title: "Sabés en qué gastás tu tiempo",
    description:
      "Podes saber que servicios te dan más plata, qué clientes vienen seguido, en qué horarios facturás mejor. Simple y de un vistazo.",
    businessImpact: "Más control, menos gasto.",
  },
];

export function BenefitsSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
      className="relative flex items-center w-full h-screen overflow-hidden"
    >
      <Image
        src="/images/benefits-background.jpg"
        alt="Barbero profesional trabajando en un corte de pelo"
        fill
        className="object-cover"
        placeholder="blur"
        blurDataURL="/images/benefits-background.jpg"
      />
      <div className="absolute inset-0 z-10 bg-black/40" />

      <div className="container relative z-20 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter text-white font-heading sm:text-5xl">
              ¿La Barber? <br /> En piloto automático
            </h2>
          </div>
        </div>
        <div className="grid items-stretch max-w-5xl gap-6 py-12 mx-auto lg:grid-cols-3 lg:gap-8">
          {benefits.map((benefit) => (
            <Card
              key={benefit.title}
              className="flex flex-col text-white bg-white/10 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-col items-center text-center">
                {benefit.icon}
                <CardTitle className="mt-4">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-center text-white/80">
                  {benefit.description}
                </p>
              </CardContent>
              <div className="p-6 pt-0">
                <p className="text-sm font-semibold text-center">
                  {benefit.businessImpact}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
