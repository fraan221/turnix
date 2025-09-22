"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { type Point, type Area } from "react-easy-crop";
import { Button } from "./ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface AvatarCropperContentProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob | null) => void;
  onClose: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

export function AvatarCropperContent({
  imageSrc,
  onCropComplete,
  onClose,
}: AvatarCropperContentProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropPixelsComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (imageSrc && croppedAreaPixels) {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar foto de perfil</DialogTitle>
        <DialogDescription className="sr-only">
          Ajusta la imagen para tu avatar. Mueve y haz zoom.
        </DialogDescription>
      </DialogHeader>
      <div className="relative w-full h-64">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropPixelsComplete}
        />
      </div>
      <div className="flex items-center gap-4 py-4">
        <ZoomOut className="w-6 h-6 mr-2 stroke-primary" />
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.1}
          onValueChange={(value) => setZoom(value[0])}
        />
        <ZoomIn className="w-6 h-6 mr-2 stroke-primary" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleCrop}>Aplicar</Button>
      </DialogFooter>
    </>
  );
}
