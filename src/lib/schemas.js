import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Requerido")
      .email("Email inválido")
      .max(254),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128)
      .regex(/[A-Z]/, "Al menos una mayúscula")
      .regex(/[a-z]/, "Al menos una minúscula")
      .regex(/\d/, "Al menos un número"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres").max(128),
    first_name: z.string().trim().min(1, "Requerido").max(50),
    last_name: z.string().trim().min(1, "Requerido").max(50),
    company_name: z.string().trim().max(100).optional(),
    whatsapp_region: z
      .string()
      .trim()
      .regex(/^\d{1,4}$/, "Ej: 54"),
    whatsapp_area: z
      .string()
      .trim()
      .regex(/^\d{2,4}$/, "Ej: 381"),
    whatsapp_number_local: z
      .string()
      .trim()
      .regex(/^\d{6,8}$/, "Ej: 9999999"),
    delivery_option: z
      .array(z.enum(["delivery", "pickup"]), {
        required_error: "Seleccioná al menos un tipo de envío",
      })
      .min(1, "Seleccioná al menos un tipo de envío"),
    niche: z.string().trim().max(100).optional(),
    social_links: z
      .string()
      .trim()
      .url("URL inválida")
      .max(500)
      .optional()
      .or(z.literal("")),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Debés aceptar los términos y condiciones" }),
    }),
    privacy: z.literal(true, {
      errorMap: () => ({ message: "Debés aceptar la política de privacidad" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().trim().min(1, "Requerido").max(100),
  brand: z.string().trim().max(50).optional(),
  category: z.string().trim().min(1, "Requerido").max(50),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Precio inválido"),
  description: z.string().trim().max(1000).optional(),
});

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Requerido").max(50),
  last_name: z.string().trim().min(1, "Requerido").max(50),
  company_name: z.string().trim().max(100).optional(),
  whatsapp_region: z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, "Ej: 54"),
  whatsapp_area: z
    .string()
    .trim()
    .regex(/^\d{2,4}$/, "Ej: 381"),
  whatsapp_number_local: z
    .string()
    .trim()
    .regex(/^\d{6,8}$/, "Ej: 9999999"),
  delivery_option: z
    .array(z.enum(["delivery", "pickup"]), {
      required_error: "Seleccioná al menos un tipo de envío",
    })
    .min(1, "Seleccioná al menos un tipo de envío"),
  niches: z.array(z.string().trim().max(100)).optional(),
  socialLinks: z
    .array(
      z.object({
        label: z.string().min(1, "Requerido").max(30),
        url: z.string().trim().url("URL inválida").max(500),
      }),
    )
    .optional(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(1, "Escribí tu experiencia").max(1000),
});
