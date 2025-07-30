import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const barbershop = await prisma.barbershop.findUnique({
      where: { slug: 'test-barber' },
      include: { owner: true, services: true },
    });

    if (!barbershop) {
      return NextResponse.json(
        { found: false, error: 'Barbershop with slug test-barber not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ found: true, data: barbershop });

  } catch (error) {
    console.error('[TEST_DATA_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { found: false, error: 'An error occurred while querying the database.', details: errorMessage },
      { status: 500 }
    );
  }
}
