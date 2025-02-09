import { AuthContext } from "@/components/AuthContext";
import { deleteMeal, fetchFoodInfo } from "@/util/queries";
import { FoodInfo } from "@/util/types";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { useContext, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Alert,
  ScrollView,
} from "react-native";

export default function Index() {
  const auth = useContext(AuthContext);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const {
    data: foodInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["foodInfo", auth?.user?.id, selectedDate],
    queryFn: () => fetchFoodInfo(auth?.user?.id as string, db, selectedDate),
    enabled: !!auth?.user?.id,
  });

  const calculateTotals = (meals: FoodInfo[]) => {
    const totals = {
      calories: 0,
      fat: 0,
      carbohydrates: 0,
      sugar: 0,
      protein: 0,
      fiber: 0,
    };

    meals.forEach((meal) => {
      totals.calories += parseFloat(meal.calories);
      totals.fat += parseFloat(meal.fat);
      totals.carbohydrates += parseFloat(meal.carbohydrates);
      totals.sugar += parseFloat(meal.sugar);
      totals.protein += parseFloat(meal.protein);
      totals.fiber += parseFloat(meal.fiber);
    });

    return totals;
  };

  const totals = calculateTotals(foodInfo || []);

  const { mutate: deleteFoodInfo } = useMutation({
    mutationFn: (mealId: string) => deleteMeal(mealId, db),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
    },
    onError: (error) => {
      console.log("Error deleting meal:", error);
      Alert.alert("Error", "Error deleting meal", [
        {
          text: "Ok",
        },
      ]);
    },
  });

  const handleDelete = (mealId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this meal?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFoodInfo(mealId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(selectedDate),
      onChange: (e, date) => {
        const convertedDate = date!.toISOString().split("T")[0];
        setSelectedDate(convertedDate);
      },
      mode: "date",
      is24Hour: true,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading food information.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>
          Nutrition Stats for {selectedDate}
        </Text>
        <View style={styles.statsRow}>
          <Text>Calories: {totals.calories} kcal</Text>
          <Text>Fat: {totals.fat} g</Text>
        </View>
        <View style={styles.statsRow}>
          <Text>Carbs: {totals.carbohydrates} g</Text>
          <Text>Sugar: {totals.sugar} g</Text>
        </View>
        <View style={styles.statsRow}>
          <Text>Protein: {totals.protein} g</Text>
          <Text>Fiber: {totals.fiber} g</Text>
        </View>
        <TouchableHighlight
          style={styles.datePickerButton}
          onPress={showDatepicker}
        >
          <Text style={styles.datePickerButtonText}>Select Date</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.mealsContainer}>
        {foodInfo?.map((meal) => (
          <View key={meal.id} style={styles.mealItem}>
            <Text style={styles.mealName}>{meal.food_name}</Text>
            <Text>Date: {meal.date}</Text>
            <Text>Meal: {meal.meal_type}</Text>
            <Text>Quantity: {meal.quantity} g</Text>
            <Text>Calories: {meal.calories} kcal</Text>
            <TouchableHighlight
              style={styles.deleteButton}
              onPress={() => handleDelete(meal.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableHighlight>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  datePickerButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  datePickerButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  mealsContainer: {
    marginBottom: 20,
  },
  mealItem: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
});
