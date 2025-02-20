import { SQLiteDatabase } from "expo-sqlite";
import { FoodInfoFull, UserInfo } from "@/util/types";

export const updateUserInfo = async (
  userInfo: UserInfo,
  hashedPassword: string,
  db: SQLiteDatabase
) => {
  const result = await db.runAsync(
    `
    UPDATE users 
    SET username = ?, password = ?, gender = ?, age = ?, height = ?, weight = ?, activityLevel = ?, goal = ?
    WHERE id = ?;`,
    [
      userInfo.username,
      hashedPassword,
      userInfo.gender,
      userInfo.age,
      userInfo.height,
      userInfo.weight,
      userInfo.activityLevel,
      userInfo.goal,
      userInfo.id,
    ]
  );

  return result;
};

export const fetchFoodInfo = async (
  userId: string,
  db: SQLiteDatabase,
  date: string
) => {
  const result = await db.getAllAsync(
    "SELECT * FROM nutrition_info WHERE user_id = ? AND date = ?",
    [userId, date]
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
  db: SQLiteDatabase
) => {
  try {
    const result = await db.runAsync(
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
      ]
    );

    return result;
  } catch (error) {
    console.log(error);
  }
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
  db: SQLiteDatabase
) => {
  try {
    const result = await db.runAsync(
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
      ]
    );

    return result;
  } catch (error) {
    console.log(error);
  }
};

export const getProductFromDb = async (barcode: string, db: SQLiteDatabase) => {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM product_info WHERE barcode = (?)",
      [barcode]
    );

    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};
