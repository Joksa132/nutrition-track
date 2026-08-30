import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableHighlight,
  Pressable,
} from "react-native";
import { useContext, useState } from "react";
import { AuthContext } from "@/components/AuthContext";
import { FoodInfo, ProductInfo } from "@/util/types";
import { useSQLiteContext } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addMealToDb,
  addProductToTemplates,
  addProductToDb,
} from "@/util/queries";
import MealForm from "@/components/MealForm";
import ProductForm from "@/components/ProductForm";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { FoodInfoSchema, ProductInfoSchema } from "@/util/validations";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

const currentDate = new Date().toISOString().split("T")[0];

const foodInfoDefault: FoodInfo = {
  foodName: "",
  mealType: "breakfast",
  quantity: "0",
  calories: "0",
  fat: "0",
  carbohydrates: "0",
  sugar: "0",
  protein: "0",
  fiber: "0",
  date: currentDate,
};

const productInfoDefault: ProductInfo = {
  productName: "",
  calories: "0",
  fat: "0",
  carbohydrates: "0",
  sugar: "0",
  protein: "0",
  fiber: "0",
  barcode: "",
};

export default function AddMeal() {
  const db = useSQLiteContext();
  const auth = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [foodInfo, setFoodInfo] = useState<FoodInfo>(foodInfoDefault);
  const [productInfo, setProductInfo] =
    useState<ProductInfo>(productInfoDefault);
  const [selectedForm, setSelectedForm] = useState<string>("meals");

  const saveMealMutation = useMutation({
    mutationFn: (foodInfo: FoodInfo) => {
      const validatedData = FoodInfoSchema.safeParse(foodInfo);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message,
        );
        throw new Error(errorMessages.join("\n"));
      }

      const quantity = validatedData.data.quantity / 100;

      const calories = validatedData.data.calories * quantity;
      const fat = validatedData.data.fat * quantity;
      const carbohydrates = validatedData.data.carbohydrates * quantity;
      const sugar = validatedData.data.sugar * quantity;
      const protein = validatedData.data.protein * quantity;
      const fiber = validatedData.data.fiber * quantity;

      return addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        validatedData.data.date,
        validatedData.data.mealType,
        validatedData.data.foodName,
        validatedData.data.quantity,
        parseFloat(calories.toFixed(2)),
        parseFloat(fat.toFixed(2)),
        parseFloat(carbohydrates.toFixed(2)),
        parseFloat(sugar.toFixed(2)),
        parseFloat(protein.toFixed(2)),
        parseFloat(fiber.toFixed(2)),
        db,
      );
    },
    onSuccess: () => {
      Alert.alert("Success", "Food information saved successfully.", [
        {
          text: "Ok",
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
      setFoodInfo(foodInfoDefault);
    },
    onError: (error: Error) => {
      Alert.alert(
        "Error",
        error.message || "Failed to save food information.",
        [
          {
            text: "Ok",
          },
        ],
      );
    },
  });

  const saveProductMutation = useMutation({
    mutationFn: (productInfo: ProductInfo) => {
      const validatedData = ProductInfoSchema.safeParse(productInfo);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message,
        );
        throw new Error(errorMessages.join("\n"));
      }

      return addProductToDb(
        Crypto.randomUUID(),
        validatedData.data.productName,
        validatedData.data.calories,
        validatedData.data.fat,
        validatedData.data.carbohydrates,
        validatedData.data.sugar,
        validatedData.data.protein,
        validatedData.data.fiber,
        validatedData.data.barcode,
        db,
      );
    },
    onSuccess: () => {
      Alert.alert("Success", "Product information saved successfully.", [
        {
          text: "Ok",
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["productInfo"] });
      setProductInfo(productInfoDefault);
    },
    onError: (error: Error) => {
      Alert.alert(
        "Error",
        error.message || "Failed to save product information.",
        [
          {
            text: "Ok",
          },
        ],
      );
    },
  });

  const saveProductTemplateMutation = useMutation({
    mutationFn: (productInfo: ProductInfo) => {
      return addProductToTemplates(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        productInfo.productName,
        parseFloat(productInfo.calories),
        parseFloat(productInfo.fat),
        parseFloat(productInfo.carbohydrates),
        parseFloat(productInfo.sugar),
        parseFloat(productInfo.protein),
        parseFloat(productInfo.fiber),
        db,
      );
    },
    onSuccess: () => {
      Alert.alert("Success", "Meal template saved successfully.", [
        { text: "Ok" },
      ]);
      queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", `Failed to save meal template: ${error.message}`, [
        { text: "Ok" },
      ]);
    },
  });

  const handleSave = () => {
    selectedForm === "meals"
      ? saveMealMutation.mutate(foodInfo)
      : saveProductMutation.mutate(productInfo);
  };

  const handleSaveTemplate = () => {
    saveProductTemplateMutation.mutate(productInfo);
  };

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(foodInfo.date),
      onChange: (_e, selectedDate) => {
        if (!selectedDate) return;
        const convertedDate = selectedDate.toISOString().split("T")[0];
        setFoodInfo((prev) => ({ ...prev, date: convertedDate }));
      },
      mode: "date",
      is24Hour: true,
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Add {selectedForm === "meals" ? "Meal" : "Product"}
        </Text>

        <View style={styles.segment}>
          {(["meals", "products"] as const).map((value) => {
            const active = selectedForm === value;
            return (
              <Pressable
                key={value}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setSelectedForm(value)}
                android_ripple={{ color: colors.surfaceAlt }}
              >
                <Text
                  style={
                    active ? styles.segmentTextActive : styles.segmentText
                  }
                >
                  {value === "meals" ? "Meals" : "Products"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedForm === "meals" ? (
          <MealForm
            styles={styles}
            foodInfo={foodInfo}
            setFoodInfo={setFoodInfo}
            showDatepicker={showDatepicker}
          />
        ) : (
          <ProductForm
            styles={styles}
            productInfo={productInfo}
            setProductInfo={setProductInfo}
          />
        )}

        {selectedForm === "meals" ? (
          <TouchableHighlight
            style={commonStyles.btnPrimary}
            underlayColor={colors.accentPress}
            onPress={handleSave}
            disabled={saveMealMutation.isPending}
          >
            <Text style={commonStyles.btnPrimaryText}>
              {saveMealMutation.isPending ? "Saving..." : "Save Meal"}
            </Text>
          </TouchableHighlight>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableHighlight
              style={[commonStyles.btnPrimary, styles.flexBtn]}
              underlayColor={colors.accentPress}
              onPress={handleSave}
              disabled={saveProductMutation.isPending}
            >
              <Text style={commonStyles.btnPrimaryText}>
                {saveProductMutation.isPending ? "Saving..." : "Save Product"}
              </Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={[commonStyles.btnGhost, styles.flexBtn]}
              underlayColor={colors.surfaceAlt}
              onPress={handleSaveTemplate}
              disabled={saveProductTemplateMutation.isPending}
            >
              <Text style={commonStyles.btnGhostText}>
                {saveProductTemplateMutation.isPending
                  ? "Saving..."
                  : "Template"}
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
  },
  title: {
    ...type.h1,
    marginBottom: space.md,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: space.lg,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.sm - 2,
    alignItems: "center",
  },
  segmentItemActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    ...type.button,
    fontSize: 14,
    color: colors.textMuted,
  },
  segmentTextActive: {
    ...type.button,
    fontSize: 14,
    color: "#FFFFFF",
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
  },
  label: {
    ...type.label,
    marginBottom: space.xs,
  },
  input: {
    height: 46,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    color: colors.text,
    fontFamily: type.body.fontFamily,
    fontSize: 15,
  },
  pickerContainer: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: space.md,
    borderRadius: radius.sm,
    height: 46,
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  flexBtn: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: space.md,
    alignItems: "center",
  },
  dateButtonText: {
    ...type.num,
    fontSize: 16,
  },
});
