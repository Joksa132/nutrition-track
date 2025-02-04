import { SQLiteDatabase } from "expo-sqlite";
import { FoodInfoFull } from "@/util/types";

export const fetchFoodInfo = async (userId: string, db: SQLiteDatabase) => {
  const result = await db.getAllAsync(
    "SELECT * FROM nutrition_info WHERE user_id = ?",
    [userId]
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
      "INSERT INTO nutrition_info (id, user_id, date, meal_type, food_name, quantity, calories, fat, carbohydrates, sugar, protein, fiber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        userId,
        date,
        mealType,
        foodName,
        quantity,
        calories,
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
