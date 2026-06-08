import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const registerSchema = z
  .object({
    email: z.string().trim().min(1, "Requerido").email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
    first_name: z.string().trim().min(1, "Requerido"),
    last_name: z.string().trim().min(1, "Requerido"),
    company_name: z.string().trim().min(1, "Requerido"),
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
    province: z.string().trim().min(1, "Requerido"),
    city: z.string().trim().min(1, "Requerido"),
    address: z.string().trim().optional(),
    birthdate: z.string().optional(),
    niche: z.string().trim().optional(),
    social_links: z
      .string()
      .trim()
      .url("URL inválida")
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
  name: z.string().min(1, "Requerido"),
  brand: z.string().optional(),
  category: z.string().min(1, "Requerido"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Precio inválido"),
  description: z.string().optional(),
});

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Requerido"),
  last_name: z.string().trim().min(1, "Requerido"),
  company_name: z.string().trim().min(1, "Requerido"),
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
  province: z.string().trim().min(1, "Requerido"),
  city: z.string().trim().min(1, "Requerido"),
  address: z.string().trim().optional(),
  birthdate: z.string().optional(),
  niche: z.string().trim().optional(),
  social_links: z
    .string()
    .trim()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(1, "Escribí tu experiencia"),
});
