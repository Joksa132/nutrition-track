import { Picker } from "@react-native-picker/picker";
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableHighlight,
  StyleSheet,
} from "react-native";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

type ModalProps = {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  mealType: string;
  setMealType: React.Dispatch<React.SetStateAction<string>>;
  handleSave: () => void;
  showDatepicker: () => void;
  selectedDate: string;
};

const MEAL_TYPES = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

const SaveModal = React.memo(
  ({
    modalVisible,
    setModalVisible,
    amount,
    setAmount,
    mealType,
    setMealType,
    handleSave,
    showDatepicker,
    selectedDate,
  }: ModalProps) => {
    if (!modalVisible) return null;
    return (
      <Modal
        transparent
        statusBarTranslucent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        hardwareAccelerated
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalCard}>
            <Text style={commonStyles.modalTitle}>Log Meal</Text>

            <Text style={commonStyles.fieldLabel}>Amount (grams)</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g. 150"
              placeholderTextColor={colors.textFaint}
              inputMode="decimal"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={commonStyles.fieldLabel}>Meal Type</Text>
            <View style={commonStyles.pickerWrap}>
              <Picker
                selectedValue={mealType}
                onValueChange={(value) => setMealType(value)}
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
              <Text style={styles.dateButtonText}>{selectedDate}</Text>
            </TouchableHighlight>

            <View style={commonStyles.modalButtonRow}>
              <TouchableHighlight
                style={[commonStyles.btnGhost, styles.flexBtn]}
                underlayColor={colors.surfaceAlt}
                onPress={() => setModalVisible(false)}
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
  },
);

const styles = StyleSheet.create({
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

export default SaveModal;
