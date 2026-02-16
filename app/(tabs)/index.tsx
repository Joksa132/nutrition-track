import { AuthContext } from "@/components/AuthContext";
import Loading from "@/components/Loading";
import EditMealModal from "@/components/EditMealModal";
import { deleteMeal, fetchFoodInfo, updateMeal } from "@/util/queries";
import { FoodInfo, FoodInfoFull } from "@/util/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useContext, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";

export default function Index() {
  const auth = useContext(AuthContext);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [selectedMeal, setSelectedMeal] = useState<FoodInfoFull | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
    setRefreshing(false);
  }, [queryClient]);

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

    totals.calories = parseFloat(totals.calories.toFixed(0));
    totals.fat = parseFloat(totals.fat.toFixed(2));
    totals.carbohydrates = parseFloat(totals.carbohydrates.toFixed(2));
    totals.sugar = parseFloat(totals.sugar.toFixed(2));
    totals.protein = parseFloat(totals.protein.toFixed(2));
    totals.fiber = parseFloat(totals.fiber.toFixed(2));

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

  const { mutate: editFoodInfo } = useMutation({
    mutationFn: (meal: FoodInfoFull) =>
      updateMeal(
        meal.id,
        meal.foodName,
        meal.mealType,
        parseFloat(String(meal.quantity)),
        parseFloat(String(meal.calories)),
        parseFloat(String(meal.fat)),
        parseFloat(String(meal.carbohydrates)),
        parseFloat(String(meal.sugar)),
        parseFloat(String(meal.protein)),
        parseFloat(String(meal.fiber)),
        meal.date,
        db
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
      Alert.alert("Success", "Meal updated successfully.");
    },
    onError: (error) => {
      console.log("Error updating meal:", error);
      Alert.alert("Error", "Error updating meal.");
    },
  });

  const handleEdit = (meal: FoodInfoFull) => {
    setSelectedMeal(meal);
    setEditModalVisible(true);
  };

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

  const calculateRecommendedIntake = (
    weight: string,
    height: string,
    age: string,
    gender: string,
    activityLevel: string,
    goal: string
  ) => {
    let bmr: number;
    let tdee: number;

    if (gender === "male") {
      bmr =
        10 * parseFloat(weight) +
        6.25 * parseFloat(height) -
        5 * parseInt(age) +
        5;
    } else {
      bmr =
        10 * parseFloat(weight) +
        6.25 * parseFloat(height) -
        5 * parseInt(age) -
        161;
    }

    switch (activityLevel) {
      case "sedentary":
        tdee = bmr * 1.2;
        break;
      case "lightly":
        tdee = bmr * 1.375;
        break;
      case "moderately":
        tdee = bmr * 1.55;
        break;
      case "very":
        tdee = bmr * 1.725;
        break;
      default:
        tdee = bmr;
    }

    let calorieTarget = tdee;
    if (goal === "weight loss") {
      calorieTarget = Math.max(tdee * 0.85, 1600);
    } else if (goal === "weight gain") {
      calorieTarget = tdee * 1.15;
    }

    const proteinRange = [0.1, 0.35];
    const fatRange = [0.2, 0.35];
    const carbRange = [0.45, 0.65];

    const proteinCal =
      calorieTarget * ((proteinRange[0] + proteinRange[1]) / 2);
    const fatCal = calorieTarget * ((fatRange[0] + fatRange[1]) / 2);
    const carbCal = calorieTarget * ((carbRange[0] + carbRange[1]) / 2);

    const proteinG = proteinCal / 4;
    const fatG = fatCal / 9;
    const carbG = carbCal / 4;

    const fiberG = (calorieTarget / 1000) * 14;

    const sugarCal = calorieTarget * 0.1;
    const sugarG = sugarCal / 4;

    return {
      calories: Math.round(calorieTarget),
      fat: Math.round(fatG),
      carbohydrates: Math.round(carbG),
      sugar: Math.round(sugarG),
      protein: Math.round(proteinG),
      fiber: Math.round(fiberG),
    };
  };

  const recommendedIntake = calculateRecommendedIntake(
    auth?.user?.weight || "0",
    auth?.user?.height || "0",
    auth?.user?.age || "0",
    auth?.user?.gender || "male",
    auth?.user?.activityLevel || "sedentary",
    auth?.user?.goal || "weight loss"
  );

  const getIndicatorColor = (actual: number, recommended: number): string => {
    const lower = recommended * 0.9;
    const upper = recommended * 1.1;
    if (actual < lower) return "blue";
    else if (actual > upper) return "red";
    return "green";
  };

  const getIndicatorIcon = (actual: number, recommended: number) => {
    const lower = recommended * 0.9;
    const upper = recommended * 1.1;
    const color = getIndicatorColor(actual, recommended);

    if (actual < lower) {
      return <Ionicons name="arrow-down-outline" size={16} color={color} />;
    } else if (actual > upper) {
      return <Ionicons name="arrow-up-outline" size={16} color={color} />;
    }
    return <Ionicons name="checkmark-outline" size={16} color={color} />;
  };

  if (isLoading) {
    return <Loading />;
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>
          Nutrition Stats for {selectedDate}
        </Text>
        <View style={styles.statsRow}>
          <Text style={{ fontSize: 13 }}>
            Calories:
            {getIndicatorIcon(totals.calories, recommendedIntake.calories)}
            <Text
              style={{
                color: getIndicatorColor(
                  totals.calories,
                  recommendedIntake.calories
                ),
              }}
            >
              {totals.calories}kcal
            </Text>
            {"/"}
            {recommendedIntake.calories}kcal
          </Text>
          <Text style={{ fontSize: 13 }}>
            Fat:{getIndicatorIcon(totals.fat, recommendedIntake.fat)}
            <Text
              style={{
                color: getIndicatorColor(totals.fat, recommendedIntake.fat),
              }}
            >
              {totals.fat}g
            </Text>
            {"/"}
            {recommendedIntake.fat}g
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={{ fontSize: 13 }}>
            Carbs:
            {getIndicatorIcon(
              totals.carbohydrates,
              recommendedIntake.carbohydrates
            )}
            <Text
              style={{
                color: getIndicatorColor(
                  totals.carbohydrates,
                  recommendedIntake.carbohydrates
                ),
              }}
            >
              {totals.carbohydrates}g
            </Text>
            {"/"}
            {recommendedIntake.carbohydrates}g
          </Text>
          <Text style={{ fontSize: 13 }}>
            Sugar:{getIndicatorIcon(totals.sugar, recommendedIntake.sugar)}
            <Text
              style={{
                color: getIndicatorColor(totals.sugar, recommendedIntake.sugar),
              }}
            >
              {totals.sugar}g
            </Text>
            {"/"}
            {recommendedIntake.sugar}g
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={{ fontSize: 13 }}>
            Protein:
            {getIndicatorIcon(totals.protein, recommendedIntake.protein)}
            <Text
              style={{
                color: getIndicatorColor(
                  totals.protein,
                  recommendedIntake.protein
                ),
              }}
            >
              {totals.protein}g
            </Text>
            {"/"}
            {recommendedIntake.protein}g
          </Text>
          <Text style={{ fontSize: 13 }}>
            Fiber:{getIndicatorIcon(totals.fiber, recommendedIntake.fiber)}
            <Text
              style={{
                color: getIndicatorColor(totals.fiber, recommendedIntake.fiber),
              }}
            >
              {totals.fiber}g
            </Text>
            {"/"}
            {recommendedIntake.fiber}g
          </Text>
        </View>
        <TouchableHighlight
          style={styles.datePickerButton}
          onPress={showDatepicker}
        >
          <Text style={styles.datePickerButtonText}>Select Date</Text>
        </TouchableHighlight>
      </View>

      <View style={styles.mealsContainer}>
        {!foodInfo || foodInfo.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No meals logged for this date.
            </Text>
          </View>
        ) : (
          foodInfo.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={styles.mealName}>{meal.foodName}</Text>
              <Text style={styles.mealDetail}>Date: {meal.date}</Text>
              <Text style={styles.mealDetail}>Meal: {meal.mealType}</Text>
              <Text style={styles.mealDetail}>Quantity: {meal.quantity} g</Text>
              <Text style={styles.mealDetail}>
                Calories: {meal.calories} kcal
              </Text>
              <Text style={styles.mealDetail}>Fat: {meal.fat} g</Text>
              <Text style={styles.mealDetail}>
                Carbs: {meal.carbohydrates} g
              </Text>
              <Text style={styles.mealDetail}>Sugar: {meal.sugar} g</Text>
              <Text style={styles.mealDetail}>Protein: {meal.protein} g</Text>
              <Text style={styles.mealDetail}>Fiber: {meal.fiber} g</Text>
              <View style={styles.mealButtons}>
                <TouchableHighlight
                  style={styles.editButton}
                  onPress={() => handleEdit(meal)}
                >
                  <Text style={styles.deleteButtonText}>Edit</Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.deleteButton}
                  onPress={() => handleDelete(meal.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableHighlight>
              </View>
            </View>
          ))
        )}
      </View>

      <EditMealModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        meal={selectedMeal}
        onSave={(meal) => editFoodInfo(meal)}
      />
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
    backgroundColor: "white",
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
  mealDetail: {
    marginBottom: 4,
    fontSize: 13,
  },
  mealButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.5)",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
});
