import { FoodInfo, FoodInfoFull } from "@/util/types";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

type EditMealModalProps = {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  meal: FoodInfoFull | null;
  onSave: (meal: FoodInfoFull) => void;
};

const MEAL_TYPES = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function EditMealModal({
  visible,
  setVisible,
  meal,
  onSave,
}: EditMealModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [mealType, setMealType] = useState<FoodInfo["mealType"]>("breakfast");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    if (visible && meal) {
      setQuantity(String(meal.quantity));
      setMealType(meal.mealType);
      setDate(meal.date);
    }
  }, [visible, meal]);

  if (!visible || !meal) return null;

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(date),
      onChange: (_e, picked) => {
        if (!picked) return;
        setDate(picked.toISOString().split("T")[0]);
      },
      mode: "date",
      is24Hour: true,
    });
  };

  const handleSave = () => {
    const newQ = parseFloat(quantity);
    if (isNaN(newQ) || newQ <= 0) {
      Alert.alert("Error", "Quantity must be a positive number.");
      return;
    }
    const oldQ = parseFloat(String(meal.quantity)) || 1;
    const scale = newQ / oldQ;
    onSave({
      ...meal,
      quantity: String(newQ),
      mealType,
      date,
      calories: String(round2(parseFloat(String(meal.calories)) * scale)),
      fat: String(round2(parseFloat(String(meal.fat)) * scale)),
      carbohydrates: String(
        round2(parseFloat(String(meal.carbohydrates)) * scale),
      ),
      sugar: String(round2(parseFloat(String(meal.sugar)) * scale)),
      protein: String(round2(parseFloat(String(meal.protein)) * scale)),
      fiber: String(round2(parseFloat(String(meal.fiber)) * scale)),
    });
    setVisible(false);
  };

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={visible}
      onRequestClose={() => setVisible(false)}
      hardwareAccelerated
    >
      <View style={commonStyles.modalOverlay}>
        <View style={commonStyles.modalCard}>
          <Text style={styles.title}>Edit Meal</Text>
          <Text style={styles.foodName} numberOfLines={1}>
            {meal.foodName}
          </Text>

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={commonStyles.fieldLabel}>Quantity (g)</Text>
            <TextInput
              style={commonStyles.input}
              value={quantity}
              placeholderTextColor={colors.textFaint}
              onChangeText={setQuantity}
              inputMode="decimal"
            />

            <Text style={commonStyles.fieldLabel}>Meal Type</Text>
            <View style={commonStyles.pickerWrap}>
              <Picker
                selectedValue={mealType}
                onValueChange={setMealType}
                style={commonStyles.picker}
                dropdownIconColor={colors.textMuted}
              >
                {MEAL_TYPES.map(({ label, value }) => (
                  <Picker.Item
                    key={value}
                    label={label}
                    value={value}
                    color={colors.text}
                    style={{ backgroundColor: colors.surfaceAlt }}
                  />
                ))}
              </Picker>
            </View>

            <Text style={commonStyles.fieldLabel}>Date</Text>
            <TouchableHighlight
              style={styles.dateButton}
              underlayColor={colors.surfaceAlt}
              onPress={showDatepicker}
            >
              <Text style={styles.dateButtonText}>{date}</Text>
            </TouchableHighlight>
          </ScrollView>

          <View style={commonStyles.modalButtonRow}>
            <TouchableHighlight
              style={[commonStyles.btnGhost, styles.flexBtn]}
              underlayColor={colors.surfaceAlt}
              onPress={() => setVisible(false)}
            >
              <Text style={commonStyles.btnGhostText}>Cancel</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={[commonStyles.btnPrimary, styles.flexBtn]}
              underlayColor={colors.accentPress}
              onPress={handleSave}
            >
              <Text style={commonStyles.btnPrimaryText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.h1,
    marginBottom: 2,
  },
  foodName: {
    ...type.caption,
    marginBottom: space.lg,
  },
  scroll: {
    flexGrow: 0,
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
  flexBtn: {
    flex: 1,
  },
});
