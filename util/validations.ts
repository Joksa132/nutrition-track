import { z } from "zod";

export const UserRegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(20, { message: "Username must be less than 20 characters" }),
    password: z
      .string()
      .min(3, { message: "Password must be at least 3 characters" })
      .max(25, { message: "Password must be less than 25 characters" })
      .refine((password) => /[a-z]/.test(password), {
        message: "Password must contain at least one lowercase letter",
      })
      .refine((password) => /[A-Z]/.test(password), {
        message: "Password must contain at least one uppercase letter",
      })
      .refine((password) => /[0-9]/.test(password), {
        message: "Password must contain at least one number",
      }),
    confirmPassword: z.string(),
    gender: z.enum(["male", "female"]),
    age: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), {
        message: "Age must be a number",
      })
      .transform((val) => parseInt(val))
      .pipe(
        z.number().min(14, { message: "Age must be at least 14" }).max(100, {
          message: "Age must be less than 100",
        })
      ),
    height: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), {
        message: "Height must be a number",
      })
      .transform((val) => parseInt(val))
      .pipe(
        z
          .number()
          .min(100, { message: "Height must be at least 100 cm" })
          .max(230, {
            message: "Height must be less than 230 cm",
          })
      ),
    weight: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), {
        message: "Weight must be a number",
      })
      .transform((val) => parseInt(val))
      .pipe(
        z
          .number()
          .min(40, { message: "Weight must be at least 40 kg" })
          .max(250, {
            message: "Weight must be less than 250 kg",
          })
      ),
    activityLevel: z.enum(["sedentary", "lightly", "moderately", "very"]),
    goal: z.enum(["weight loss", "weight gain", "maintenance"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const UserLoginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be less than 20 characters" }),
  password: z
    .string()
    .min(3, { message: "Password must be at least 3 characters" })
    .max(25, { message: "Password must be less than 25 characters" })
    .refine((password) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((password) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((password) => /[0-9]/.test(password), {
      message: "Password must contain at least one number",
    }),
});

export const UserUpdateSchema = z
  .object({
    id: z.string().uuid(),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(20, { message: "Username must be less than 20 characters" }),
    password: z
      .string()
      .min(3, { message: "Password must be at least 3 characters" })
      .max(25, { message: "Password must be less than 25 characters" })
      .refine((password) => /[a-z]/.test(password), {
        message: "Password must contain at least one lowercase letter",
      })
      .refine((password) => /[A-Z]/.test(password), {
        message: "Password must contain at least one uppercase letter",
      })
      .refine((password) => /[0-9]/.test(password), {
        message: "Password must contain at least one number",
      }),
    confirmPassword: z.string(),
    gender: z.enum(["male", "female"]),
    age: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), {
        message: "Age must be a number",
      })
      .transform((val) => parseInt(val))
      .pipe(
        z.number().min(14, { message: "Age must be at least 14" }).max(100, {
          message: "Age must be less than 100",
        })
      ),
    height: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), {
        message: "Height must be a number",
      })
      .transform((val) => parseInt(val))
      .pipe(
        z
          .number()
          .min(100, { message: "Height must be at least 100 cm" })
          .max(230, {
            message: "Height must be less than 230 cm",
          })
      ),
    weight: z
      .string()
      .refine((val) => !isNaN(parseInt(val)), {
        message: "Weight must be a number",
      })
      .transform((val) => parseInt(val))
      .pipe(
        z
          .number()
          .min(40, { message: "Weight must be at least 40 kg" })
          .max(250, {
            message: "Weight must be less than 250 kg",
          })
      ),
    activityLevel: z.enum(["sedentary", "lightly", "moderately", "very"]),
    goal: z.enum(["weight loss", "weight gain", "maintenance"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UserUpdateSchemaType = z.infer<typeof UserUpdateSchema>;
