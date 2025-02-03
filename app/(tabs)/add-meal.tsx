import {
  Text,
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableHighlight,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useContext, useState } from "react";
import { AuthContext } from "@/components/AuthContext";
import { FoodInfo } from "@/util/types";
import { useSQLiteContext } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMealToDb } from "@/util/queries";

export default function AddMeal() {
  const db = useSQLiteContext();
  const auth = useContext(AuthContext);
  const queryClient = useQueryClient();

  const currentDate = new Date().toISOString().split("T")[0];

  const [foodInfo, setFoodInfo] = useState<FoodInfo>({
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
  });

  const saveMutation = useMutation({
    mutationFn: (foodInfo: FoodInfo) =>
      addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        foodInfo.date,
        foodInfo.mealType,
        foodInfo.foodName,
        foodInfo.quantity === "" ? 0 : parseFloat(foodInfo.quantity),
        foodInfo.calories === "" ? 0 : parseFloat(foodInfo.calories),
        foodInfo.fat === "" ? 0 : parseFloat(foodInfo.fat),
        foodInfo.carbohydrates === "" ? 0 : parseFloat(foodInfo.carbohydrates),
        foodInfo.sugar === "" ? 0 : parseFloat(foodInfo.sugar),
        foodInfo.protein === "" ? 0 : parseFloat(foodInfo.protein),
        foodInfo.fiber === "" ? 0 : parseFloat(foodInfo.fiber),
        db
      ),
    onSuccess: () => {
      Alert.alert("Success", "Food information saved successfully.", [
        {
          text: "Ok",
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
      setFoodInfo({
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
      });
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

  const handleSave = () => {
    saveMutation.mutate(foodInfo);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Meals Manually</Text>
          <Text style={styles.subText}>Enter product details below.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Food Name</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.foodName}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({ ...prev, foodName: text }))
            }
          />

          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={foodInfo.mealType}
              onValueChange={(value) =>
                setFoodInfo((prev) => ({ ...prev, mealType: value }))
              }
            >
              <Picker.Item label="Breakfast" value="breakfast" />
              <Picker.Item label="Lunch" value="lunch" />
              <Picker.Item label="Dinner" value="dinner" />
              <Picker.Item label="Snack" value="snack" />
            </Picker>
          </View>

          <Text style={styles.label}>Quantity (g)</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.quantity}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                quantity: text,
              }))
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Calories</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.calories}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                calories: text,
              }))
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.fat}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                fat: text,
              }))
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Carbohydrates (g)</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.carbohydrates}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                carbohydrates: text,
              }))
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Sugar (g)</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.sugar}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                sugar: text,
              }))
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.protein}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                protein: text,
              }))
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Fiber (g)</Text>
          <TextInput
            style={styles.input}
            value={foodInfo.fiber}
            onChangeText={(text) =>
              setFoodInfo((prev) => ({
                ...prev,
                fiber: text,
              }))
            }
            inputMode="decimal"
          />

          <TouchableHighlight
            style={styles.buttonContainer}
            onPress={handleSave}
            disabled={saveMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {saveMutation.isPending ? "Saving..." : "Save Food"}
            </Text>
          </TouchableHighlight>
        </View>
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
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});
