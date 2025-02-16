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
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Enter Amount in Grams</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount in grams"
            inputMode="decimal"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.modalTitle}>Choose Meal Type</Text>
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
          <View style={{ marginTop: -30, alignItems: "center" }}>
            <Text style={styles.modalTitle}>Choose Date</Text>
            <TouchableHighlight
              style={styles.dateButton}
              onPress={showDatepicker}
            >
              <Text style={styles.dateButtonText}>Date: {selectedDate}</Text>
            </TouchableHighlight>
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableHighlight
              style={styles.scanAgainButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.scanAgainText}>Cancel</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.scanAgainButton}
              onPress={handleSave}
            >
              <Text style={styles.scanAgainText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  scanButtonsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
  },
  scanAgainButton: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    marginTop: 5,
    width: "100%",
    flex: 1,
  },
  scanAgainText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    backgroundColor: "white",
    width: 200,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: "black",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    gap: 20,
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    borderRadius: 4,
    height: 40,
    width: 200,
    backgroundColor: "white",
    justifyContent: "center",
    marginBottom: 40,
  },
  dateButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    width: 200,
    padding: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
});

export default SaveModal;
