// QrCode.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";

interface Props {
  value: string;
  size?: number; // tamaño del QR (lado en px)
  caption?: string; // texto inferior opcional
}

export default function QrCodeGenerator({ value, size = 260, caption }: Props) {
  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div
        className="relative p-3 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F6F3FF 100%)",
          boxShadow:
            "0 0 60px rgba(157, 0, 255, 0.40), 0 0 120px rgba(255, 0, 229, 0.18)",
        }}
      >
        {/* Borde degradado brand */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            padding: 2,
            background: "linear-gradient(135deg, var(--accent), var(--brand))",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any,
            maskComposite: "exclude" as any,
          }}
        />

        <QRCodeSVG
          value={value}
          size={size}
          bgColor={"#FFFFFF"}
          fgColor={"#2D0845"}
          level={"Q"} // balance de tolerancia + densidad
          includeMargin={false}
        />
      </div>

      {caption ? (
        <p
          className="text-lg font-medium"
          style={{
            color: "#E500FF",
            textShadow: "0 0 14px rgba(229,0,255,.45)",
          }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
