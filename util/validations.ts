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

export const FoodInfoSchema = z.object({
  foodName: z
    .string()
    .min(2, { message: "Food name must be at least 2 characters" })
    .max(50, { message: "Food name must be less than 50 characters" }),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  quantity: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Quantity must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(1, { message: "Quantity must be at least 1 gram" })
        .max(1000, {
          message: "Quantity must be less than 1000 grams",
        })
    ),
  calories: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Calories must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z.number().min(1, { message: "Calories must be at least 1" }).max(2000, {
        message: "Calories must be less than 2000",
      })
    ),
  fat: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Fat must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z.number().min(0, { message: "Fat must be a positive number" }).max(200, {
        message: "Fat must be less than 200 grams",
      })
    ),
  carbohydrates: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Carbohydrates must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Carbohydrates must be a positive number" })
        .max(200, {
          message: "Carbohydrates must be less than 200 grams",
        })
    ),
  sugar: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Sugar must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Sugar must be a positive number" })
        .max(200, {
          message: "Sugar must be less than 200 grams",
        })
    ),
  protein: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Protein must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Protein must be a positive number" })
        .max(200, {
          message: "Protein must be less than 200 grams",
        })
    ),
  fiber: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Fiber must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Fiber must be a positive number" })
        .max(200, {
          message: "Fiber must be less than 200 grams",
        })
    ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  }),
});

export const ProductInfoSchema = z.object({
  productName: z
    .string()
    .min(2, { message: "Product name must be at least 2 characters" })
    .max(50, { message: "Product name must be less than 50 characters" }),
  calories: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Calories must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z.number().min(1, { message: "Calories must be at least 1" }).max(2000, {
        message: "Calories must be less than 2000",
      })
    ),
  fat: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Fat must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z.number().min(0, { message: "Fat must be a positive number" }).max(200, {
        message: "Fat must be less than 200 grams",
      })
    ),
  carbohydrates: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Carbohydrates must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Carbohydrates must be a positive number" })
        .max(200, {
          message: "Carbohydrates must be less than 200 grams",
        })
    ),
  sugar: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Sugar must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Sugar must be a positive number" })
        .max(200, {
          message: "Sugar must be less than 200 grams",
        })
    ),
  protein: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Protein must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Protein must be a positive number" })
        .max(200, {
          message: "Protein must be less than 200 grams",
        })
    ),
  fiber: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Fiber must be a number",
    })
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .min(0, { message: "Fiber must be a positive number" })
        .max(200, {
          message: "Fiber must be less than 200 grams",
        })
    ),
  barcode: z.string(),
});

export type UserUpdateSchemaType = z.infer<typeof UserUpdateSchema>;
