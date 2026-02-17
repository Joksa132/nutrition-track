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
    return (
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        hardwareAccelerated={true}
      >
        <View style={styles.dimOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Meal</Text>

            <Text style={styles.fieldLabel}>Amount (grams)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150"
              inputMode="decimal"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.fieldLabel}>Meal Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mealType}
                onValueChange={(value) => setMealType(value)}
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
              <Text style={styles.dateButtonText}>{selectedDate}</Text>
            </TouchableHighlight>

            <View style={styles.buttonRow}>
              <TouchableHighlight
                style={styles.outlineButton}
                underlayColor="#f0f0f0"
                onPress={() => setModalVisible(false)}
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
);

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
    width: "85%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
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
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 15,
    color: "black",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
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

export default SaveModal;
