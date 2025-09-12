"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export function CtaSection() {
  return (
    <section className="relative flex items-center w-full h-screen overflow-hidden">
      <Image
        src="/images/cta-background.jpg"
        alt="Letrero de neón de una barbería"
        fill
        className="object-cover"
        placeholder="blur"
        blurDataURL="/images/cta-background.jpg"
      />
      <div className="absolute inset-0 z-10 bg-black/60" />

      <div className="container relative z-20 grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="flex flex-col items-center max-w-3xl gap-6 mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-white md:text-4xl/tight font-heading">
            ¿Empezamos?
          </h2>
          <p className="text-white/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            14 días para probar todo gratis. <br /> Si no te convence, podes
            dejar de usar la aplicación.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 mt-6">
          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="w-full max-w-sm"
          >
            <Button asChild size="lg" className="w-full">
              <Link href="/register">Comenzar</Link>
            </Button>
          </motion.div>
          <p className="text-xs text-white/70">
            Sin tarjeta • Configuración en 15 minutos
          </p>
        </div>
      </div>
    </section>
  );
}
