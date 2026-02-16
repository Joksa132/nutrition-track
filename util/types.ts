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

export type UserRegister = {
  username: string;
  password: string;
  confirmPassword: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
  activityLevel: string;
  goal: string;
};

export type UserInfo = UserRegister & {
  id: string;
};

export type OpenFoodFactsProduct = {
  product_name: string;
  product_name_en: string;
  nutriments: {
    "energy-kcal"?: number;
    "energy-kcal_100g"?: number;
    fat?: number;
    fat_100g?: number;
    carbohydrates?: number;
    carbohydrates_100g?: number;
    sugars?: number;
    sugars_100g?: number;
    proteins?: number;
    proteins_100g?: number;
    fiber?: number;
    fiber_100g?: number;
  };
  code: string;
};

export type ProductTemplate = {
  id: string;
  user_id: string;
  product_name: string;
  calories: number;
  fat: number;
  carbohydrates: number;
  sugar: number;
  protein: number;
  fiber: number;
};
