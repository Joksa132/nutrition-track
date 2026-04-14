import { AuthContext } from "@/components/AuthContext";
import Loading from "@/components/Loading";
import EditMealModal from "@/components/EditMealModal";
import {
  addProductToTemplates,
  deleteMeal,
  fetchFoodInfo,
  updateMeal,
} from "@/util/queries";
import { FoodInfo, FoodInfoFull } from "@/util/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import * as Crypto from "expo-crypto";
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
import { commonStyles } from "@/styles/common";

export default function Index() {
  const auth = useContext(AuthContext);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
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
        db,
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

  const { mutate: saveAsTemplate } = useMutation({
    mutationFn: (meal: FoodInfoFull) => {
      const quantity = parseFloat(String(meal.quantity));
      const scale = 100 / quantity;

      return addProductToTemplates(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        meal.foodName,
        parseFloat(String(meal.calories)) * scale,
        parseFloat(String(meal.fat)) * scale,
        parseFloat(String(meal.carbohydrates)) * scale,
        parseFloat(String(meal.sugar)) * scale,
        parseFloat(String(meal.protein)) * scale,
        parseFloat(String(meal.fiber)) * scale,
        db,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
      Alert.alert("Success", "Meal saved as template (per 100g).");
    },
    onError: (error) => {
      console.log("Error saving template:", error);
      Alert.alert("Error", "Failed to save template.");
    },
  });

  const handleSaveAsTemplate = (meal: FoodInfoFull) => {
    saveAsTemplate(meal);
  };

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
      { cancelable: true },
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
    goal: string,
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
    auth?.user?.goal || "weight loss",
  );

  const getIndicator = (actual: number, recommended: number, noUpperLimit = false) => {
    const lower = recommended * 0.9;
    const upper = recommended * 1.1;

    if (actual < lower)
      return { color: "blue", icon: <Ionicons name="arrow-down-outline" size={14} color="blue" /> };
    if (!noUpperLimit && actual > upper)
      return { color: "red", icon: <Ionicons name="arrow-up-outline" size={14} color="red" /> };
    return { color: "green", icon: <Ionicons name="checkmark-outline" size={14} color="green" /> };
  };

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
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
      <View style={styles.container}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>
            Nutrition Stats for {selectedDate.split("-").reverse().join(".")}
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Calories</Text>
              <View style={styles.statValueRow}>
                {getIndicator(totals.calories, recommendedIntake.calories).icon}
                <Text
                  style={[
                    styles.statValue,
                    { color: getIndicator(totals.calories, recommendedIntake.calories).color },
                  ]}
                >
                  {" "}
                  {totals.calories}
                </Text>
                <Text style={styles.statRecommended}>
                  {" "}
                  / {recommendedIntake.calories} kcal
                </Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Fat</Text>
              <View style={styles.statValueRow}>
                {getIndicator(totals.fat, recommendedIntake.fat).icon}
                <Text
                  style={[
                    styles.statValue,
                    { color: getIndicator(totals.fat, recommendedIntake.fat).color },
                  ]}
                >
                  {" "}
                  {totals.fat}
                </Text>
                <Text style={styles.statRecommended}>
                  {" "}
                  / {recommendedIntake.fat}g
                </Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Carbs</Text>
              <View style={styles.statValueRow}>
                {getIndicator(totals.carbohydrates, recommendedIntake.carbohydrates).icon}
                <Text
                  style={[
                    styles.statValue,
                    { color: getIndicator(totals.carbohydrates, recommendedIntake.carbohydrates).color },
                  ]}
                >
                  {" "}
                  {totals.carbohydrates}
                </Text>
                <Text style={styles.statRecommended}>
                  {" "}
                  / {recommendedIntake.carbohydrates}g
                </Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Sugar</Text>
              <View style={styles.statValueRow}>
                {getIndicator(totals.sugar, recommendedIntake.sugar).icon}
                <Text
                  style={[
                    styles.statValue,
                    { color: getIndicator(totals.sugar, recommendedIntake.sugar).color },
                  ]}
                >
                  {" "}
                  {totals.sugar}
                </Text>
                <Text style={styles.statRecommended}>
                  {" "}
                  / {recommendedIntake.sugar}g
                </Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Protein</Text>
              <View style={styles.statValueRow}>
                {getIndicator(totals.protein, recommendedIntake.protein, true).icon}
                <Text
                  style={[
                    styles.statValue,
                    { color: getIndicator(totals.protein, recommendedIntake.protein, true).color },
                  ]}
                >
                  {" "}
                  {totals.protein}
                </Text>
                <Text style={styles.statRecommended}>
                  {" "}
                  / {recommendedIntake.protein}g
                </Text>
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Fiber</Text>
              <View style={styles.statValueRow}>
                {getIndicator(totals.fiber, recommendedIntake.fiber).icon}
                <Text
                  style={[
                    styles.statValue,
                    { color: getIndicator(totals.fiber, recommendedIntake.fiber).color },
                  ]}
                >
                  {" "}
                  {totals.fiber}
                </Text>
                <Text style={styles.statRecommended}>
                  {" "}
                  / {recommendedIntake.fiber}g
                </Text>
              </View>
            </View>
          </View>
          <TouchableHighlight
            style={styles.datePickerButton}
            underlayColor="#f0f0f0"
            onPress={showDatepicker}
          >
            <Text style={styles.datePickerButtonText}>Select Date</Text>
          </TouchableHighlight>
        </View>

        {!foodInfo || foodInfo.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No meals logged for this date.
            </Text>
          </View>
        ) : (
          foodInfo.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {meal.foodName}
                </Text>
                <View style={styles.mealTypeBadge}>
                  <Text style={styles.mealTypeBadgeText}>
                    {formatMealType(meal.mealType)}
                  </Text>
                </View>
              </View>
              <Text style={styles.mealSubtext}>
                {meal.quantity}g · {meal.date.split("-").reverse().join(".")}
              </Text>
              <View style={styles.separator} />
              <View style={commonStyles.macroGrid}>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Calories</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.calories} kcal
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Protein</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.protein}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.carbohydrates}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Fat</Text>
                  <Text style={commonStyles.macroCellValue}>{meal.fat}g</Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.sugar}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Fiber</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.fiber}g
                  </Text>
                </View>
              </View>
              <View style={styles.mealButtons}>
                <TouchableHighlight
                  style={styles.editButton}
                  underlayColor="#333"
                  onPress={() => handleEdit(meal)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.templateButton}
                  underlayColor="#f0f0f0"
                  onPress={() => handleSaveAsTemplate(meal)}
                >
                  <Text style={styles.templateButtonText}>Template</Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.deleteButton}
                  underlayColor="#f0f0f0"
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
    marginBottom: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCell: {
    width: "50%",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  statRecommended: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
  },
  datePickerButton: {
    backgroundColor: "transparent",
    borderColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 12,
  },
  datePickerButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 14,
  },
  mealCard: commonStyles.card,
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  mealName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
  },
  mealTypeBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  mealTypeBadgeText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
    fontWeight: "500",
  },
  mealSubtext: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#e8e8e8",
    marginBottom: 8,
  },
  mealButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    flex: 1,
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  templateButton: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "black",
    padding: 10,
    alignItems: "center",
    flex: 1,
  },
  templateButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "black",
    padding: 10,
    alignItems: "center",
    flex: 1,
  },
  deleteButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.5)",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
});
