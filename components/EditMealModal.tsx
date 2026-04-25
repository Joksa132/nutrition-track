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

type EditMealModalProps = {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  meal: FoodInfoFull | null;
  onSave: (meal: FoodInfoFull) => void;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function EditMealModal({
  visible,
  setVisible,
  meal,
  onSave,
}: EditMealModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [mealType, setMealType] =
    useState<FoodInfo["mealType"]>("breakfast");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    if (visible && meal) {
      setQuantity(String(meal.quantity));
      setMealType(meal.mealType);
      setDate(meal.date);
    }
  }, [visible, meal]);

  if (!meal) return null;

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
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.dimOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Meal</Text>
          <Text style={styles.foodName} numberOfLines={1}>
            {meal.foodName}
          </Text>

          <ScrollView
            style={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Quantity (g)</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              inputMode="decimal"
            />

            <Text style={styles.fieldLabel}>Meal Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mealType}
                onValueChange={setMealType}
              >
                <Picker.Item label="Breakfast" value="breakfast" />
                <Picker.Item label="Lunch" value="lunch" />
                <Picker.Item label="Dinner" value="dinner" />
                <Picker.Item label="Snack" value="snack" />
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableHighlight
              style={styles.dateButton}
              underlayColor="#f0f0f0"
              onPress={showDatepicker}
            >
              <Text style={styles.dateButtonText}>{date}</Text>
            </TouchableHighlight>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableHighlight
              style={styles.outlineButton}
              underlayColor="#f0f0f0"
              onPress={() => setVisible(false)}
            >
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.primaryButton}
              underlayColor="#333"
              onPress={handleSave}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  foodName: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    marginBottom: 16,
  },
  formScroll: {
    flexGrow: 0,
  },
  fieldLabel: {
    fontSize: 13,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
  },
  dateButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 15,
    color: "black",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  outlineButton: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "black",
    padding: 12,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 15,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "black",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
});
