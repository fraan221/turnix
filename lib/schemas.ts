import { z } from "zod";

export const ServiceInputSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es requerido." })
    .max(50, { message: "El nombre no puede tener más de 50 caracteres." }),

  price: z
    .union([
      z.string().min(1, { message: "El precio es requerido." }),
      z
        .number()
        .positive({ message: "El precio debe ser un número positivo." }),
    ])
    .refine(
      (val) => {
        if (typeof val === "string") {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0 && num <= 1000000;
        }
        return val > 0 && val <= 1000000;
      },
      {
        message: "El precio debe ser un número válido y positivo.",
      }
    ),

  durationInMinutes: z
    .union([
      z.string().refine(
        (val) => {
          if (val === "" || val === null) return true;
          const num = parseInt(val, 10);
          return !isNaN(num) && num > 0 && num <= 1440;
        },
        {
          message:
            "La duración debe ser un número entre 1 y 1440 minutos(Un dia).",
        }
      ),
      z.number().int().positive().max(1440, {
        message: "La duración no puede ser de más de un día.",
      }),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),

  description: z
    .string()
    .max(200, {
      message: "La descripción no puede tener más de 200 caracteres.",
    })
    .optional()
    .nullable(),
});

export const ServiceSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es requerido." })
    .max(50, { message: "El nombre no puede tener más de 50 caracteres." }),

  price: z.preprocess(
    (val) => {
      if (val === "") return undefined;
      return val;
    },
    z.coerce
      .number({
        error: "El precio es requerido.",
      })
      .positive({ message: "El precio debe ser un número positivo." })
      .max(1000000, { message: "El precio parece demasiado alto." })
  ),

  durationInMinutes: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce
      .number({ error: "La duración debe ser un número." })
      .int({ message: "La duración debe ser en minutos enteros." })
      .positive({ message: "La duración debe ser un número positivo." })
      .max(1440, {
        message: "La duración no puede ser de más de un día (1440 min).",
      })
      .optional()
      .nullable()
  ),

  description: z
    .string()
    .max(200, {
      message: "La descripción no puede tener más de 200 caracteres.",
    })
    .optional()
    .nullable(),
});
