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

export type TemplateFormValues = {
  productName: string;
  calories: string;
  fat: string;
  carbohydrates: string;
  sugar: string;
  protein: string;
  fiber: string;
};

export type TemplateFormSubmit = {
  productName: string;
  calories: number;
  fat: number;
  carbohydrates: number;
  sugar: number;
  protein: number;
  fiber: number;
};

type Props = {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  initial: TemplateFormValues;
  onSubmit: (values: TemplateFormSubmit) => void;
};

const macroFields: {
  key: keyof Omit<TemplateFormValues, "productName">;
  label: string;
}[] = [
  { key: "calories", label: "Calories (per 100g)" },
  { key: "fat", label: "Fat (g per 100g)" },
  { key: "carbohydrates", label: "Carbs (g per 100g)" },
  { key: "sugar", label: "Sugar (g per 100g)" },
  { key: "protein", label: "Protein (g per 100g)" },
  { key: "fiber", label: "Fiber (g per 100g)" },
];

export default function TemplateFormModal({
  visible,
  setVisible,
  title,
  initial,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TemplateFormValues>(initial);

  useEffect(() => {
    if (visible) setForm(initial);
  }, [visible, initial]);

  if (!visible) return null;

  const setField = (key: keyof TemplateFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const name = form.productName.trim();
    if (name.length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters.");
      return;
    }
    const parsed: Record<string, number> = {};
    for (const { key, label } of macroFields) {
      const v = parseFloat(form[key]);
      if (isNaN(v) || v < 0) {
        Alert.alert("Error", `${label.split(" ")[0]} must be a positive number.`);
        return;
      }
      parsed[key] = v;
    }
    onSubmit({
      productName: name,
      calories: parsed.calories,
      fat: parsed.fat,
      carbohydrates: parsed.carbohydrates,
      sugar: parsed.sugar,
      protein: parsed.protein,
      fiber: parsed.fiber,
    });
  };

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="slide"
      visible={visible}
      onRequestClose={() => setVisible(false)}
      hardwareAccelerated
    >
      <View style={styles.dimOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={form.productName}
              onChangeText={(v) => setField("productName", v)}
            />
            {macroFields.map(({ key, label }) => (
              <View key={key}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={(v) => setField(key, v)}
                  inputMode="decimal"
                />
              </View>
            ))}
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
    padding: 20,
    width: "90%",
    maxHeight: "85%",
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  label: {
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
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
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
