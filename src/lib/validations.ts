import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const libraryCredentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  cookie: z.string().optional(),
});

export const settingsSchema = z.object({
  discordWebhookUrl: z.string().url().optional().or(z.literal("")),
  renewDaysBefore: z.coerce.number().int().min(1).max(30),
  autoRenewEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
});
