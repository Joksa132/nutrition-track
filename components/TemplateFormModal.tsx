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
import { commonStyles } from "@/styles/common";
import { colors } from "@/styles/theme";

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
        Alert.alert(
          "Error",
          `${label.split(" ")[0]} must be a positive number.`,
        );
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
      animationType="fade"
      visible={visible}
      onRequestClose={() => setVisible(false)}
      hardwareAccelerated
    >
      <View style={commonStyles.modalOverlay}>
        <View style={commonStyles.modalCard}>
          <Text style={commonStyles.modalTitle}>{title}</Text>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={commonStyles.fieldLabel}>Name</Text>
            <TextInput
              style={commonStyles.input}
              value={form.productName}
              placeholderTextColor={colors.textFaint}
              onChangeText={(v) => setField("productName", v)}
            />
            {macroFields.map(({ key, label }) => (
              <View key={key}>
                <Text style={commonStyles.fieldLabel}>{label}</Text>
                <TextInput
                  style={commonStyles.input}
                  value={form[key]}
                  placeholderTextColor={colors.textFaint}
                  onChangeText={(v) => setField(key, v)}
                  inputMode="decimal"
                />
              </View>
            ))}
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
  scroll: {
    flexGrow: 0,
  },
  flexBtn: {
    flex: 1,
  },
});
