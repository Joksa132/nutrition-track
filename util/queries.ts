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
