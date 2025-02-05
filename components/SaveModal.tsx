import { Picker } from "@react-native-picker/picker";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableHighlight,
  ViewStyle,
  TextStyle,
} from "react-native";

type Styles = {
  modalContainer: ViewStyle;
  modalTitle: TextStyle;
  input: TextStyle;
  pickerContainer: ViewStyle;
  modalButtonContainer: ViewStyle;
  scanAgainButton: ViewStyle;
  scanAgainText: TextStyle;
};

type ModalProps = {
  styles: Styles;
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  mealType: string;
  setMealType: React.Dispatch<React.SetStateAction<string>>;
  handleSave: () => void;
};

export default function SaveModal({
  styles,
  modalVisible,
  setModalVisible,
  amount,
  setAmount,
  mealType,
  setMealType,
  handleSave,
}: ModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
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
