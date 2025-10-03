"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QrCodeGenerator({ value }: { value: string }) {
  return (
    <div className="inline-block p-4 bg-white rounded-lg">
      <QRCodeSVG
        value={value}
        size={180}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"L"}
        includeMargin={false}
      />
    </div>
  );
}
