import Image from "next/image";

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col items-center p-8 mb-8 text-center border-2 border-dashed rounded-lg md:flex-row md:text-left">
        <div className="flex-shrink-0">
          <Image
            src="/images/SVG-WORKING-SECTION.svg"
            alt="Ilustración de una persona construyendo una web"
            width={200}
            height={200}
            className="mb-4 md:mb-0 md:mr-8"
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-heading">
            ¡Tutoriales y guías en camino!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Estamos trabajando para expandir esta sección y convertirla en un
            centro de recursos completo con tutoriales didácticos y guías en
            video. El objetivo es ayudarte a sacarle el máximo provecho a
            Turnix.
          </p>
        </div>
      </div>
    </div>
  );
}
