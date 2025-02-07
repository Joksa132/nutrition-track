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
import { addMealToDb, addProductToDb } from "@/util/queries";
import MealForm from "@/components/MealForm";
import ProductForm from "@/components/ProductForm";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

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
      const quantity =
        foodInfo.quantity === "" ? 0 : parseFloat(foodInfo.quantity);
      const actualQuantity = quantity / 100;

      return addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        foodInfo.date,
        foodInfo.mealType,
        foodInfo.foodName,
        foodInfo.quantity === "" ? 0 : parseFloat(foodInfo.quantity),
        foodInfo.calories === ""
          ? 0
          : parseFloat(foodInfo.calories) * actualQuantity,
        foodInfo.fat === "" ? 0 : parseFloat(foodInfo.fat) * actualQuantity,
        foodInfo.carbohydrates === ""
          ? 0
          : parseFloat(foodInfo.carbohydrates) * actualQuantity,
        foodInfo.sugar === "" ? 0 : parseFloat(foodInfo.sugar) * actualQuantity,
        foodInfo.protein === ""
          ? 0
          : parseFloat(foodInfo.protein) * actualQuantity,
        foodInfo.fiber === "" ? 0 : parseFloat(foodInfo.fiber) * actualQuantity,
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
      return addProductToDb(
        Crypto.randomUUID(),
        productInfo.productName,
        productInfo.calories === "" ? 0 : parseFloat(productInfo.calories),
        productInfo.fat === "" ? 0 : parseFloat(productInfo.fat),
        productInfo.carbohydrates === ""
          ? 0
          : parseFloat(productInfo.carbohydrates),
        productInfo.sugar === "" ? 0 : parseFloat(productInfo.sugar),
        productInfo.protein === "" ? 0 : parseFloat(productInfo.protein),
        productInfo.fiber === "" ? 0 : parseFloat(productInfo.fiber),
        productInfo.barcode,
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

  const handleSave = () => {
    selectedForm === "meals"
      ? saveMealMutation.mutate(foodInfo)
      : saveProductMutation.mutate(productInfo);
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
});
