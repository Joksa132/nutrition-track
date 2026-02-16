import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableHighlight,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
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
          (error) => error.message
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
        db
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
        ]
      );
    },
  });

  const saveProductMutation = useMutation({
    mutationFn: (productInfo: ProductInfo) => {
      const validatedData = ProductInfoSchema.safeParse(productInfo);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message
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
        db
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
        ]
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
        db
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
      onChange: (e, selectedDate) => {
        const convertedDate = selectedDate!.toISOString().split("T")[0];
        setFoodInfo((prev) => ({ ...prev, date: convertedDate }));
      },
      mode: "date",
      is24Hour: true,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedForm} onValueChange={setSelectedForm}>
            <Picker.Item label="Meals" value="meals" />
            <Picker.Item label="Products" value="products" />
          </Picker>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Add {selectedForm === "meals" ? "Meals" : "Products"} Manually
          </Text>
          <Text style={styles.subText}>
            Enter {selectedForm === "meals" ? "meal" : "product"} details below.
          </Text>
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

        <TouchableHighlight
          style={styles.buttonContainer}
          onPress={handleSave}
          disabled={
            selectedForm === "meals"
              ? saveMealMutation.isPending
              : saveProductMutation.isPending
          }
        >
          {selectedForm === "meals" ? (
            <Text style={styles.buttonText}>
              {saveMealMutation.isPending ? "Saving..." : "Save Meal"}
            </Text>
          ) : (
            <Text style={styles.buttonText}>
              {saveProductMutation.isPending ? "Saving..." : "Save Product"}
            </Text>
          )}
        </TouchableHighlight>

        {selectedForm === "products" && (
          <TouchableHighlight
            style={styles.saveTemplateButton}
            onPress={handleSaveTemplate}
            disabled={saveProductTemplateMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {saveProductTemplateMutation.isPending
                ? "Saving Template..."
                : "Save Template"}
            </Text>
          </TouchableHighlight>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    marginTop: 5,
  },
  sectionContainer: {},
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
  },
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 4,
    height: 40,
    justifyContent: "center",
  },
  buttonContainer: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  dateButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  saveTemplateButton: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
});
