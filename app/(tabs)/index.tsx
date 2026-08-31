import { AuthContext } from "@/components/AuthContext";
import Loading from "@/components/Loading";
import EditMealModal from "@/components/EditMealModal";
import SaveModal from "@/components/SaveModal";
import {
  addMealToDb,
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
  Pressable,
} from "react-native";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

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

  const [repeatModalVisible, setRepeatModalVisible] = useState<boolean>(false);
  const [mealToRepeat, setMealToRepeat] = useState<FoodInfoFull | null>(null);
  const [repeatAmount, setRepeatAmount] = useState<string>("");
  const [repeatMealType, setRepeatMealType] = useState<string>("breakfast");
  const [repeatDate, setRepeatDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

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

  const { mutate: repeatMeal } = useMutation({
    mutationFn: (vars: {
      meal: FoodInfoFull;
      amount: number;
      mealType: string;
      date: string;
    }) => {
      const { meal, amount, mealType, date } = vars;
      const oldQ = parseFloat(String(meal.quantity)) || 1;
      const scale = amount / oldQ;
      return addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        date,
        mealType,
        meal.foodName,
        amount,
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
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
      setRepeatModalVisible(false);
      Alert.alert("Success", "Meal logged.");
    },
    onError: (error) => {
      console.log("Error logging meal again:", error);
      Alert.alert("Error", "Failed to log meal.");
    },
  });

  const handleRepeat = (meal: FoodInfoFull) => {
    setMealToRepeat(meal);
    setRepeatAmount(String(meal.quantity));
    setRepeatMealType(meal.mealType);
    setRepeatDate(new Date().toISOString().split("T")[0]);
    setRepeatModalVisible(true);
  };

  const handleRepeatSave = () => {
    if (!mealToRepeat) return;
    const amountNum = parseFloat(repeatAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Amount must be a positive number.");
      return;
    }
    repeatMeal({
      meal: mealToRepeat,
      amount: amountNum,
      mealType: repeatMealType,
      date: repeatDate,
    });
  };

  const showRepeatDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(repeatDate),
      onChange: (_e, date) => {
        if (!date) return;
        setRepeatDate(date.toISOString().split("T")[0]);
      },
      mode: "date",
      is24Hour: true,
    });
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
      onChange: (_e, date) => {
        if (!date) return;
        const convertedDate = date.toISOString().split("T")[0];
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

    const weightKg = parseFloat(weight);

    let proteinPerKg: number;
    if (goal === "weight loss") proteinPerKg = 2.2;
    else if (goal === "weight gain") proteinPerKg = 1.6;
    else proteinPerKg = 1.8;
    const proteinG = proteinPerKg * weightKg;

    const fatFromPct = (calorieTarget * 0.25) / 9;
    const fatMin = 0.8 * weightKg;
    const fatG = Math.max(fatFromPct, fatMin);

    const carbsKcal = calorieTarget - proteinG * 4 - fatG * 9;
    const carbG = Math.max(carbsKcal, 0) / 4;

    const fiberG = (calorieTarget / 1000) * 14;
    const sugarG = (calorieTarget * 0.1) / 4;

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

  const statusColor = (actual: number, recommended: number) => {
    const lower = recommended * 0.9;
    const upper = recommended * 1.1;
    if (actual < lower) return colors.neutral;
    if (actual > upper) return colors.warn;
    return colors.success;
  };

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDateLabel = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const today = new Date();
    const isToday =
      dt.getFullYear() === today.getFullYear() &&
      dt.getMonth() === today.getMonth() &&
      dt.getDate() === today.getDate();
    if (isToday) return "Today";
    return dt.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <View style={commonStyles.screen}>
        <Text style={commonStyles.errorText}>
          Error loading food information.
        </Text>
      </View>
    );
  }

  const caloriePct = Math.min(
    (totals.calories / (recommendedIntake.calories || 1)) * 100,
    100,
  );
  const caloriesLeft = recommendedIntake.calories - totals.calories;

  const macros = [
    { key: "fat", label: "Fat", unit: "g" },
    { key: "carbohydrates", label: "Carbs", unit: "g" },
    { key: "sugar", label: "Sugar", unit: "g" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "fiber", label: "Fiber", unit: "g" },
  ] as const;

  return (
    <View style={commonStyles.screen}>
      <ScrollView
        contentContainerStyle={commonStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <Pressable style={styles.datePill} onPress={showDatepicker}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.datePillText}>
            {formatDateLabel(selectedDate)}
          </Text>
          <Text style={styles.datePillSub}>
            {selectedDate.split("-").reverse().join(".")}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textFaint} />
        </Pressable>

        <View style={styles.hero}>
          <Text style={commonStyles.fieldLabel}>Calories</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroNumber}>
              {totals.calories.toLocaleString()}
            </Text>
            <Text style={styles.heroTarget}>
              / {recommendedIntake.calories.toLocaleString()}
            </Text>
          </View>
          <View style={styles.rail}>
            <View
              style={[
                styles.railFill,
                {
                  width: `${caloriePct}%`,
                  backgroundColor: statusColor(
                    totals.calories,
                    recommendedIntake.calories,
                  ),
                },
              ]}
            />
          </View>
          <Text style={styles.heroFooter}>
            {caloriesLeft >= 0
              ? `${caloriesLeft.toLocaleString()} calories left`
              : `${Math.abs(caloriesLeft).toLocaleString()} calories over`}
          </Text>
        </View>

        <View style={styles.macroPanel}>
          {macros.map(({ key, label, unit }) => {
            const actual = totals[key];
            const target = recommendedIntake[key];
            const pct = Math.min((actual / (target || 1)) * 100, 100);
            const tint = statusColor(actual, target);
            return (
              <View key={key} style={styles.macroStat}>
                <Text style={styles.macroStatLabel}>{label}</Text>
                <Text style={styles.macroStatValue}>
                  {actual}
                  <Text style={styles.macroStatTarget}>
                    {" "}
                    / {target}
                    {unit}
                  </Text>
                </Text>
                <View style={styles.miniRail}>
                  <View
                    style={[
                      styles.miniRailFill,
                      { width: `${pct}%`, backgroundColor: tint },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={commonStyles.sectionTitle}>
          Meals{" "}
          <Text style={styles.mealCount}>{foodInfo ? foodInfo.length : 0}</Text>
        </Text>

        {!foodInfo || foodInfo.length === 0 ? (
          <Text style={commonStyles.emptyText}>
            No meals logged for this date.
          </Text>
        ) : (
          foodInfo.map((meal) => (
            <View key={meal.id} style={commonStyles.card}>
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
                    {meal.calories}
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Fat</Text>
                  <Text style={commonStyles.macroCellValue}>{meal.fat}g</Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.carbohydrates}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                  <Text style={commonStyles.macroCellValue}>{meal.sugar}g</Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Protein</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {meal.protein}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Fiber</Text>
                  <Text style={commonStyles.macroCellValue}>{meal.fiber}g</Text>
                </View>
              </View>
              <View style={styles.mealActions}>
                <TouchableHighlight
                  style={commonStyles.btnPrimary}
                  underlayColor={colors.accentPress}
                  onPress={() => handleRepeat(meal)}
                >
                  <Text style={commonStyles.btnPrimaryText}>Repeat</Text>
                </TouchableHighlight>
                <View style={styles.mealSecondaryRow}>
                  <TouchableHighlight
                    style={[commonStyles.btnGhost, styles.flexBtn]}
                    underlayColor={colors.surfaceAlt}
                    onPress={() => handleEdit(meal)}
                  >
                    <Text style={styles.secondaryText}>Edit</Text>
                  </TouchableHighlight>
                  <TouchableHighlight
                    style={[commonStyles.btnGhost, styles.flexBtn]}
                    underlayColor={colors.surfaceAlt}
                    onPress={() => handleSaveAsTemplate(meal)}
                  >
                    <Text style={styles.secondaryText}>Template</Text>
                  </TouchableHighlight>
                  <TouchableHighlight
                    style={[commonStyles.btnGhost, styles.flexBtn]}
                    underlayColor={colors.surfaceAlt}
                    onPress={() => handleDelete(meal.id)}
                  >
                    <Text style={styles.secondaryText}>Delete</Text>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <EditMealModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        meal={selectedMeal}
        onSave={(meal) => editFoodInfo(meal)}
      />

      <SaveModal
        modalVisible={repeatModalVisible}
        setModalVisible={setRepeatModalVisible}
        amount={repeatAmount}
        setAmount={setRepeatAmount}
        mealType={repeatMealType}
        setMealType={setRepeatMealType}
        handleSave={handleRepeatSave}
        showDatepicker={showRepeatDatepicker}
        selectedDate={repeatDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.lg,
  },
  datePillText: {
    ...type.h2,
    fontSize: 16,
  },
  datePillSub: {
    ...type.caption,
    color: colors.textFaint,
  },

  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.sm,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space.sm,
  },
  heroNumber: {
    ...type.numLarge,
    fontSize: 48,
    lineHeight: 52,
  },
  heroTarget: {
    ...type.numLarge,
    fontSize: 26,
    lineHeight: 30,
    color: colors.textFaint,
  },
  rail: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    marginTop: space.md,
  },
  railFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  heroFooter: {
    ...type.caption,
    marginTop: space.sm,
  },

  macroPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    marginBottom: space.xl,
  },
  macroStat: {
    width: "33.33%",
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  macroStatLabel: {
    ...type.label,
    fontSize: 10,
    marginBottom: 2,
  },
  macroStatValue: {
    fontFamily: type.num.fontFamily,
    fontSize: 17,
    color: colors.text,
  },
  macroStatTarget: {
    fontFamily: type.body.fontFamily,
    fontSize: 12,
    color: colors.textFaint,
  },
  miniRail: {
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    marginTop: space.sm,
  },
  miniRailFill: {
    height: "100%",
    borderRadius: radius.pill,
  },

  mealCount: {
    ...type.h2,
    color: colors.textFaint,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: 2,
  },
  mealName: {
    ...type.h2,
    flex: 1,
    fontSize: 17,
  },
  mealTypeBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  mealTypeBadgeText: {
    fontFamily: type.label.fontFamily,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.accent,
  },
  mealSubtext: {
    ...type.caption,
    color: colors.textFaint,
    marginBottom: space.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: space.sm,
  },
  mealActions: {
    gap: space.sm,
    marginTop: space.md,
  },
  mealSecondaryRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  flexBtn: {
    flex: 1,
    paddingVertical: space.sm,
  },
  secondaryText: {
    ...type.button,
    fontSize: 13,
    color: colors.textMuted,
  },
});
