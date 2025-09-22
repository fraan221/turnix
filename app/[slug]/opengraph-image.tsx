import { ImageResponse } from "next/og";
import { getCachedBarberProfile } from "@/lib/data";

export const runtime = "edge";
export const alt = "Turnix - Agenda de Turnos Online";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);

  const barbershop = await getCachedBarberProfile(slug);

  if (!barbershop) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "black",
            color: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Perfil no encontrado
        </div>
      ),
      {
        ...size,
      }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

  const fontHeadingData = await fetch(
    new URL("/assets/Montserrat-Bold.ttf", baseUrl)
  ).then((res) => res.arrayBuffer());

  const fontSansData = await fetch(
    new URL("/assets/Inter-Regular.ttf", baseUrl)
  ).then((res) => res.arrayBuffer());

  const imageUrl = barbershop.image || barbershop.owner.image;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          fontFamily: '"Inter"',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
            width: "90%",
            height: "90%",
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Logo"
              width={256}
              height={256}
              style={{
                borderRadius: "9999px",
                objectFit: "cover",
                border: "8px solid #e5e7eb",
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: "60%",
            }}
          >
            <h1
              style={{
                fontSize: 64,
                fontFamily: '"Montserrat"',
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.1,
              }}
            >
              {barbershop.name}
            </h1>
            <p style={{ fontSize: 28, color: "#4b5563" }}>
              {barbershop.address || "Agenda tu turno online"}
            </p>
            <p
              style={{
                fontSize: 24,
                color: "#6b7280",
                marginTop: 24,
              }}
            >
              ¡Reserva tu cita fácil y rápido con Turnix!
            </p>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#6b7280",
            fontSize: 18,
          }}
        >
          <span>Potenciado por</span>
          <span style={{ fontWeight: "bold", color: "#111827" }}>Turnix</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Montserrat",
          data: fontHeadingData,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: fontSansData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
