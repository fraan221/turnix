import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "¿Necesito instalar algo en mi computadora?",
    answer:
      "Turnix funciona 100% online. Solo necesitás internet y listo. Podés usarlo desde tu celular, tablet o computadora.",
  },
  {
    question: "¿Mis clientes tienen que descargar alguna app?",
    answer:
      "Tus clientes reservan desde una página web simple y directa que funciona en cualquier celular. No necesitan descargar nada.",
  },
  {
    question: "¿Es complicado de configurar?",
    answer:
      "En menos de 15 minutos ya podés estar recibiendo tus primeros turnos online. Te guiamos paso a paso si necesitás ayuda.",
  },
  {
    question: "¿Qué pasa cuando terminan mis 14 días gratis?",
    answer:
      "Podés elegir si querés continuar con la suscripción o no. Si decidís no seguir, tus datos van a estar seguros por 30 días más por si cambiás de opinión.",
  },
  {
    question: "¿Funciona si tengo poca experiencia con tecnología?",
    answer:
      "Turnix está diseñado para ser de simple uso. Además, tenés soporte en español siempre que lo necesites.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí, podés cancelar tu suscripción en cualquier momento desde tu panel de control. Sin permanencia, sin penalizaciones.",
  },
];

export function FaqSection() {
  return (
    <section className="w-full py-12 bg-muted/60 md:py-24 lg:py-32">
      <div className="container max-w-4xl px-4 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              FAQs
            </h2>
          </div>
        </div>
        <div className="pt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
