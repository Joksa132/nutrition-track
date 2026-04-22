import { SQLiteDatabase } from "expo-sqlite";
import { FoodInfoFull, UserInfo } from "@/util/types";

export const updateUserProfile = async (
  userInfo: UserInfo,
  db: SQLiteDatabase,
) => {
  const result = await db.runAsync(
    `
    UPDATE users
    SET username = ?, gender = ?, age = ?, height = ?, weight = ?, activityLevel = ?, goal = ?
    WHERE id = ?;`,
    [
      userInfo.username,
      userInfo.gender,
      userInfo.age,
      userInfo.height,
      userInfo.weight,
      userInfo.activityLevel,
      userInfo.goal,
      userInfo.id,
    ],
  );

  return result;
};

export const updateUserPassword = async (
  userId: string,
  hashedPassword: string,
  db: SQLiteDatabase,
) => {
  const result = await db.runAsync(
    `UPDATE users SET password = ? WHERE id = ?;`,
    [hashedPassword, userId],
  );

  return result;
};

export const fetchFoodInfo = async (
  userId: string,
  db: SQLiteDatabase,
  date: string,
) => {
  const result = await db.getAllAsync(
    "SELECT * FROM nutrition_info WHERE user_id = ? AND date = ?",
    [userId, date],
  );

  return result as FoodInfoFull[];
};

export const deleteMeal = async (mealId: string, db: SQLiteDatabase) => {
  const result = await db.runAsync("DELETE FROM nutrition_info WHERE id = ?", [
    mealId,
  ]);

  return result;
};

export const addMealToDb = async (
  id: string,
  userId: string,
  date: string,
  mealType: string,
  foodName: string,
  quantity: number,
  calories: number,
  fat: number,
  carbohydrates: number,
  sugar: number,
  protein: number,
  fiber: number,
  db: SQLiteDatabase,
) => {
  return await db.runAsync(
    "INSERT INTO nutrition_info (id, user_id, date, mealType, foodName, quantity, calories, fat, carbohydrates, sugar, protein, fiber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      userId,
      date,
      mealType,
      foodName,
      quantity,
      Math.round(calories * 100) / 100,
      Math.round(fat * 100) / 100,
      Math.round(carbohydrates * 100) / 100,
      Math.round(sugar * 100) / 100,
      Math.round(protein * 100) / 100,
      Math.round(fiber * 100) / 100,
    ],
  );
};

export const addProductToDb = async (
  id: string,
  productName: string,
  calories: number,
  fat: number,
  carbohydrates: number,
  sugar: number,
  protein: number,
  fiber: number,
  barcode: string,
  db: SQLiteDatabase,
) => {
  return await db.runAsync(
    "INSERT INTO product_info (id, product_name, calories, fat, carbohydrates, sugar, protein, fiber, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      productName,
      Math.round(calories * 100) / 100,
      Math.round(fat * 100) / 100,
      Math.round(carbohydrates * 100) / 100,
      Math.round(sugar * 100) / 100,
      Math.round(protein * 100) / 100,
      Math.round(fiber * 100) / 100,
      barcode,
    ],
  );
};

export const addProductToTemplates = async (
  id: string,
  userId: string,
  productName: string,
  calories: number,
  fat: number,
  carbohydrates: number,
  sugar: number,
  protein: number,
  fiber: number,
  db: SQLiteDatabase,
) => {
  return await db.runAsync(
    "INSERT INTO product_templates (id, user_id, product_name, calories, fat, carbohydrates, sugar, protein, fiber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      userId,
      productName,
      Math.round(calories * 100) / 100,
      Math.round(fat * 100) / 100,
      Math.round(carbohydrates * 100) / 100,
      Math.round(sugar * 100) / 100,
      Math.round(protein * 100) / 100,
      Math.round(fiber * 100) / 100,
    ],
  );
};

export const getProductFromDb = async (barcode: string, db: SQLiteDatabase) => {
  return await db.getFirstAsync(
    "SELECT * FROM product_info WHERE barcode = (?)",
    [barcode],
  );
};

export const getAllTemplates = async (userId: string, db: SQLiteDatabase) => {
  return await db.getAllAsync(
    "SELECT * FROM product_templates WHERE user_id = (?)",
    [userId],
  );
};

export const deleteTemplate = async (
  templateId: string,
  db: SQLiteDatabase,
) => {
  return await db.runAsync("DELETE FROM product_templates WHERE id = (?)", [
    templateId,
  ]);
};

export const registerUser = async (
  id: string,
  username: string,
  hashedPassword: string,
  gender: string | number,
  age: string | number,
  height: string | number,
  weight: string | number,
  activityLevel: string | number,
  goal: string | number,
  db: SQLiteDatabase,
) => {
  const result = await db.runAsync(
    "INSERT INTO users (id, username, password, gender, age, height, weight, activityLevel, goal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      username,
      hashedPassword,
      gender,
      age,
      height,
      weight,
      activityLevel,
      goal,
    ],
  );

  return result;
};

export const updateMeal = async (
  mealId: string,
  foodName: string,
  mealType: string,
  quantity: number,
  calories: number,
  fat: number,
  carbohydrates: number,
  sugar: number,
  protein: number,
  fiber: number,
  date: string,
  db: SQLiteDatabase,
) => {
  const result = await db.runAsync(
    `UPDATE nutrition_info
     SET foodName = ?, mealType = ?, quantity = ?, calories = ?, fat = ?, carbohydrates = ?, sugar = ?, protein = ?, fiber = ?, date = ?
     WHERE id = ?`,
    [
      foodName,
      mealType,
      quantity,
      Math.round(calories * 100) / 100,
      Math.round(fat * 100) / 100,
      Math.round(carbohydrates * 100) / 100,
      Math.round(sugar * 100) / 100,
      Math.round(protein * 100) / 100,
      Math.round(fiber * 100) / 100,
      date,
      mealId,
    ],
  );

  return result;
};
