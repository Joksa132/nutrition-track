import { FoodInfoFull } from "@/util/types";
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

export default function EditMealModal({
  visible,
  setVisible,
  meal,
  onSave,
}: EditMealModalProps) {
  const [editedMeal, setEditedMeal] = useState<FoodInfoFull | null>(null);

  useEffect(() => {
    if (visible && meal) {
      setEditedMeal({ ...meal });
    }
  }, [visible, meal]);

  if (!editedMeal) return null;

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(editedMeal.date),
      onChange: (_e, date) => {
        if (date) {
          const convertedDate = date.toISOString().split("T")[0];
          setEditedMeal((prev) => prev ? { ...prev, date: convertedDate } : prev);
        }
      },
      mode: "date",
      is24Hour: true,
    });
  };

  const handleSave = () => {
    if (!editedMeal.foodName.trim()) {
      Alert.alert("Error", "Food name cannot be empty.");
      return;
    }
    onSave(editedMeal);
    setVisible(false);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.modalContainer}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle}>Edit Meal</Text>

          <Text style={styles.label}>Food Name</Text>
          <TextInput
            style={styles.input}
            value={editedMeal.foodName}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, foodName: text } : prev)
            }
          />

          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={editedMeal.mealType}
              onValueChange={(value) =>
                setEditedMeal((prev) => prev ? { ...prev, mealType: value } : prev)
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
            value={String(editedMeal.quantity)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, quantity: text } : prev)
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Calories</Text>
          <TextInput
            style={styles.input}
            value={String(editedMeal.calories)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, calories: text } : prev)
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={String(editedMeal.fat)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, fat: text } : prev)
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Carbohydrates (g)</Text>
          <TextInput
            style={styles.input}
            value={String(editedMeal.carbohydrates)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, carbohydrates: text } : prev)
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Sugar (g)</Text>
          <TextInput
            style={styles.input}
            value={String(editedMeal.sugar)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, sugar: text } : prev)
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            value={String(editedMeal.protein)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, protein: text } : prev)
            }
            inputMode="decimal"
          />

          <Text style={styles.label}>Fiber (g)</Text>
          <TextInput
            style={styles.input}
            value={String(editedMeal.fiber)}
            onChangeText={(text) =>
              setEditedMeal((prev) => prev ? { ...prev, fiber: text } : prev)
            }
            inputMode="decimal"
          />

          <TouchableHighlight style={styles.dateButton} onPress={showDatepicker}>
            <Text style={styles.dateButtonText}>Date: {editedMeal.date}</Text>
          </TouchableHighlight>

          <View style={styles.buttonContainer}>
            <TouchableHighlight style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.button}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableHighlight>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    alignSelf: "flex-start",
    width: "80%",
  },
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    width: "80%",
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 4,
    height: 40,
    width: "80%",
    justifyContent: "center",
  },
  dateButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    width: "80%",
    padding: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    gap: 10,
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
