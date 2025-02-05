import { View, Text, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FoodInfo } from "@/util/types";
import { ViewStyle, TextStyle } from "react-native";

type Styles = {
  section: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  pickerContainer: ViewStyle;
};

type MealFormProps = {
  styles: Styles;
  foodInfo: FoodInfo;
  setFoodInfo: React.Dispatch<React.SetStateAction<FoodInfo>>;
};

export default function MealForm({
  styles,
  foodInfo,
  setFoodInfo,
}: MealFormProps) {
  return (
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

      <Text style={styles.label}>Calories (100g)</Text>
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

      <Text style={styles.label}>Fat (100g)</Text>
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

      <Text style={styles.label}>Carbohydrates (100g)</Text>
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

      <Text style={styles.label}>Sugar (100g)</Text>
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

      <Text style={styles.label}>Protein (100g)</Text>
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

      <Text style={styles.label}>Fiber (100g)</Text>
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
    </View>
  );
}
