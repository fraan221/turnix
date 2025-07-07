import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookingComponent from "@/components/BookingComponent";

interface BarberPublicPageProps {
  params: {
    slug: string;
  };
}

export default async function BarberPublicPage({ params }: BarberPublicPageProps) {
  const barber = await prisma.user.findUnique({
    where: {
      slug: decodeURIComponent(params.slug),
    },
    include: {
      services: {
        orderBy: {
          name: 'asc',
        }
      },
    },
  });

  if (!barber) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 bg-muted/40 md:p-12">
      <div className="w-full max-w-3xl space-y-8">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-center justify-center p-6 text-center bg-card">
            <Avatar className="w-24 h-24 mb-4 border-4 border-background">
              <AvatarImage src={barber.image || ''} alt={barber.name || 'Avatar del barbero'} />
              <AvatarFallback>{barber.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold">
              {barber.barbershopName || barber.name}
            </CardTitle>
          </CardHeader>
        </Card>
        <BookingComponent services={barber.services} barberId={barber.id} />
      </div>
    </main>
  );
}