import { z } from "zod";
import { createArgentinaDate } from "@/lib/date-helpers";

export const ServiceInputSchema = z
  .object({
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
        },
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
          },
        ),
        z.number().int().positive().max(1440, {
          message: "La duración no puede ser de más de un día.",
        }),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .nullable(),

    activeDurationInMinutes: z
      .union([
        z.string().refine(
          (val) => {
            if (val === "" || val === null) return true;
            const num = parseInt(val, 10);
            return !isNaN(num) && num > 0 && num <= 1440;
          },
          {
            message:
              "El tiempo activo debe ser un número entre 1 y 1440 minutos.",
          },
        ),
        z.number().int().positive().max(1440, {
          message: "El tiempo activo no puede ser de más de un día.",
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
  })
  .refine(
    (data) => {
      const duration =
        typeof data.durationInMinutes === "string"
          ? parseInt(data.durationInMinutes, 10)
          : data.durationInMinutes;
      const activeDuration =
        typeof data.activeDurationInMinutes === "string"
          ? parseInt(data.activeDurationInMinutes, 10)
          : data.activeDurationInMinutes;

      if (
        duration != null &&
        activeDuration != null &&
        !Number.isNaN(duration) &&
        !Number.isNaN(activeDuration)
      ) {
        return activeDuration <= duration;
      }

      return true;
    },
    {
      message: "El tiempo activo no puede ser mayor que la duración total.",
      path: ["activeDurationInMinutes"],
    },
  );

export const ServiceSchema = z
  .object({
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
        .max(1000000, { message: "El precio parece demasiado alto." }),
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
        .nullable(),
    ),

    activeDurationInMinutes: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.coerce
        .number({ error: "El tiempo activo debe ser un número." })
        .int({ message: "El tiempo activo debe ser en minutos enteros." })
        .positive({ message: "El tiempo activo debe ser un número positivo." })
        .max(1440, {
          message: "El tiempo activo no puede ser de más de un día (1440 min).",
        })
        .optional()
        .nullable(),
    ),

    description: z
      .string()
      .max(200, {
        message: "La descripción no puede tener más de 200 caracteres.",
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (
        data.activeDurationInMinutes != null &&
        data.durationInMinutes != null
      ) {
        return data.activeDurationInMinutes <= data.durationInMinutes;
      }

      return true;
    },
    {
      message: "El tiempo activo no puede ser mayor que la duración total.",
      path: ["activeDurationInMinutes"],
    },
  );

export const RecurringBookingSchema = z.object({
  barberId: z
    .string()
    .cuid({ message: "ID de barbero inválido." })
    .optional()
    .or(z.literal("")),
  clientId: z.string().min(1, { message: "Seleccioná un cliente." }),
  serviceId: z.string().min(1, { message: "Seleccioná un servicio." }),
  dayOfWeek: z
    .number()
    .int()
    .min(0, { message: "Día inválido." })
    .max(6, { message: "Día inválido." }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Formato de hora inválido (HH:mm).",
    }),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"], {
    message: "Seleccioná una frecuencia.",
  }),
});

export const SuspendRecurringBookingSchema = z.object({
  recurringBookingId: z
    .string()
    .min(1, { message: "ID de turno fijo requerido." }),
});

export const CompleteBookingSchema = z.object({
  bookingId: z.string().cuid({ message: "ID de turno inválido." }),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD"], {
    message: "Seleccioná un método de pago.",
  }),
});

export const UpdateBookingServiceSchema = z.object({
  bookingId: z.string().cuid({ message: "ID de turno inválido." }),
  serviceId: z.string().cuid({ message: "ID de servicio inválido." }),
  force: z.boolean().optional().default(false),
});

export const CashflowCategorySchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(50, "El nombre no puede superar los 50 caracteres.")
    .trim(),
});

export const CashflowTransactionSchema = z.object({
  amount: z.coerce.number()
    .positive("El monto debe ser mayor a 0.")
    .max(100_000_000, "Monto demasiado alto."),
  type: z.enum(["INFLOW", "OUTFLOW"], {
    message: "Seleccioná si es un ingreso o egreso.",
  }),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD"], {
    message: "Seleccioná el método de pago/caja.",
  }),
  categoryId: z.string({ message: "Seleccioná una categoría." }),
  fixedExpenseId: z.string().optional().nullable().or(z.literal("")),
  description: z.string().max(200, "La descripción no puede superar los 200 caracteres.").optional().or(z.literal("")),
  date: z.coerce.date({ message: "La fecha es obligatoria." }),
});

export const FixedExpenseSchema = z.object({
  name: z.string()
    .min(2, "El nombre del ítem debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .trim(),
  amount: z.coerce.number()
    .positive("El monto debe ser mayor a 0.")
    .max(100_000_000, "Monto demasiado alto."),
  startDate: z.coerce.date({ message: "La fecha de inicio es obligatoria." }),
  active: z.boolean().default(true),
});

export const LinkBarberSchema = z.object({
  connectionCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "El código debe ser de 6 dígitos numéricos." }),
});

export const BookingFormSchema = z.object({
  barberId: z.string().cuid({ message: "ID de barbero inválido." }),
  serviceIds: z.string().min(1, { message: "Seleccioná al menos un servicio." }),
  clientName: z
    .string()
    .min(1, "El nombre es requerido.")
    .max(50, "El nombre no puede exceder los 50 caracteres."),
  clientPhone: z
    .string()
    .transform((val) => val.replace(/[\s-()]/g, ""))
    .pipe(
      z
        .string()
        .min(8, "El número de WhatsApp debe tener al menos 8 dígitos.")
    )
    .pipe(
      z
        .string()
        .max(15, "El número de WhatsApp no puede tener más de 15 dígitos.")
    )
    .pipe(
      z
        .string()
        .regex(
          /^[0-9]+$/,
          "El número de WhatsApp solo puede contener dígitos."
        )
    ),
  startTime: z.string().datetime({ message: "Formato de hora de inicio inválido." }),
  acceptPolicy: z.string().optional(),
});

export const TimeBlockBaseSchema = z
  .object({
    startDateTime: z
      .string()
      .datetime({ message: "Formato de fecha de inicio inválido." }),
    endDateTime: z
      .string()
      .datetime({ message: "Formato de fecha de fin inválido." }),
    reason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      return new Date(data.endDateTime) > new Date(data.startDateTime);
    },
    {
      message: "La fecha y hora de fin debe ser posterior a la de inicio.",
      path: ["endDateTime"],
    },
  );

export const CreateTimeBlockSchema = TimeBlockBaseSchema.extend({
  barberId: z.string().min(1).optional().nullable(),
}).refine(
  (data) => {
    return new Date(data.startDateTime) > new Date();
  },
  {
    message: "No puedes crear un bloqueo en una fecha u hora pasada.",
    path: ["startDateTime"],
  },
);

export const UpdateTimeBlockSchema = TimeBlockBaseSchema;

export const TimeBlockFormSchema = z
  .object({
    startDate: z.string().min(1, { message: "La fecha de inicio es requerida." }),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Formato de hora de inicio inválido (HH:mm).",
    }),
    endDate: z.string().min(1, { message: "La fecha de fin es requerida." }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Formato de hora de fin inválido (HH:mm).",
    }),
    reason: z.string().max(200, { message: "La razón no puede tener más de 200 caracteres." }).optional().nullable().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (
      !data.startDate ||
      !data.endDate ||
      !timeRegex.test(data.startTime) ||
      !timeRegex.test(data.endTime)
    ) {
      return;
    }

    const startDateTime = createArgentinaDate(data.startDate, data.startTime);
    const endDateTime = createArgentinaDate(data.endDate, data.endTime);

    if (endDateTime <= startDateTime) {
      if (data.endDate < data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha de fin no puede ser anterior a la de inicio.",
          path: ["endDate"],
        });
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La hora de fin debe ser posterior a la de inicio en el mismo día.",
          path: ["endTime"],
        });
      }
    }
  });

export const EditBookingTimeSchema = z
  .object({
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Formato de hora de inicio inválido (HH:mm).",
    }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Formato de hora de fin inválido (HH:mm).",
    }),
  })
  .refine(
    (data) => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
        return true;
      }
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return endMinutes > startMinutes;
    },
    {
      message: "La hora de fin debe ser posterior a la de inicio.",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
        return true;
      }
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
      return duration >= 5;
    },
    {
      message: "La duración debe ser de al menos 5 minutos.",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
        return true;
      }
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
      return duration <= 480;
    },
    {
      message: "La duración no puede exceder las 8 horas (480 minutos).",
      path: ["endTime"],
    }
  );

export const ClientNoteSchema = z.object({
  note: z
    .string()
    .min(1, { message: "La nota no puede estar vacía." })
    .max(500, { message: "La nota no puede superar los 500 caracteres." }),
});


