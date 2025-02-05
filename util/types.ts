export type FoodInfo = {
  foodName: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  quantity: string;
  calories: string;
  fat: string;
  carbohydrates: string;
  sugar: string;
  protein: string;
  fiber: string;
  date: string;
};

export type FoodInfoFull = FoodInfo & {
  id: string;
};

export type ProductInfo = {
  productName: string;
  calories: string;
  fat: string;
  carbohydrates: string;
  sugar: string;
  protein: string;
  fiber: string;
  barcode: string;
};
