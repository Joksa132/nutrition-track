import {
  Text,
  View,
  StyleSheet,
  Button,
  TouchableHighlight,
  Alert,
  Linking,
} from "react-native";
import { useContext, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMealToDb, getProductFromDb } from "@/util/queries";
import { AuthContext } from "@/components/AuthContext";
import * as Crypto from "expo-crypto";
import SaveModal from "@/components/SaveModal";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SaveModalSchema } from "@/util/validations";
import Loading from "@/components/Loading";
import { useCameraPermission } from "react-native-vision-camera";
import ScannerCamera from "@/components/Camera";

export default function Scanner() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [scanned, setScanned] = useState<boolean>(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext);

  const fetchProductInfo = async (barcode: string) => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === "failure") {
      const data2 = await getProductFromDb(barcode, db);
      return data2;
    }

    return data.product || null;
  };

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["productInfo", barcode],
    queryFn: () =>
      barcode ? fetchProductInfo(barcode) : Promise.resolve(null),
    enabled: !!barcode,
  });

  const handleBarcodeScanned = (barcodeData: string) => {
    setScanned(true);
    setBarcode(barcodeData);
    refetch();
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        "Permission Required",
        "Camera access is required to scan barcodes. Please enable it in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcode(null);
    setAmount("");
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <Button title="Grant Camera Access" onPress={handlePermissionRequest} />
      </View>
    );
  }

  const handleSave = () => {
    const validatedData = SaveModalSchema.safeParse({
      amount,
      mealType,
      selectedDate,
    });

    if (!validatedData.success) {
      const errorMessages = validatedData.error.errors.map(
        (error) => error.message
      );
      Alert.alert("Validation Error", errorMessages.join("\n"));
      return;
    }

    if (product) {
      const calories =
        (product.nutriments?.["energy-kcal_100g"] || product.calories || 0) *
        (validatedData.data.amount / 100);
      const fat =
        (product.nutriments?.fat_100g || product.fat || 0) *
        (validatedData.data.amount / 100);
      const carbs =
        (product.nutriments?.carbohydrates_100g || product.carbohydrates || 0) *
        (validatedData.data.amount / 100);
      const protein =
        (product.nutriments?.proteins_100g || product.protein || 0) *
        (validatedData.data.amount / 100);
      const sugar =
        (product.nutriments?.sugars_100g || product.sugar || 0) *
        (validatedData.data.amount / 100);
      const fiber =
        (product.nutriments?.fiber_100g || product.fiber || 0) *
        (validatedData.data.amount / 100);

      addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        validatedData.data.selectedDate,
        validatedData.data.mealType,
        product.product_name_en || product.product_name,
        validatedData.data.amount,
        parseFloat(calories.toFixed(2)),
        parseFloat(fat.toFixed(2)),
        parseFloat(carbs.toFixed(2)),
        parseFloat(sugar.toFixed(2)),
        parseFloat(protein.toFixed(2)),
        parseFloat(fiber.toFixed(2)),
        db
      );

      Alert.alert("Success", "Successfully saved this meal");
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
      setModalVisible(false);
      resetScanner();
    }
  };

  const openAmountModal = () => {
    setModalVisible(true);
  };

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(selectedDate),
      onChange: (e, selectedDate) => {
        const convertedDate = selectedDate!.toISOString().split("T")[0];
        setSelectedDate(convertedDate);
      },
      mode: "date",
      is24Hour: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScannerCamera
        styles={styles}
        scanned={scanned}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {scanned && (
        <View style={styles.overlay}>
          {isLoading && <Loading />}
          {isError && (
            <Text style={styles.overlayText}>
              Error fetching product information.
            </Text>
          )}
          {product === null && (
            <Text style={styles.overlayText}>Product not found.</Text>
          )}
          {product && (
            <View>
              <Text style={styles.productName}>
                {product.product_name_en || product.product_name}
              </Text>
              <Text>
                Calories:{" "}
                {product.nutriments?.["energy-kcal_100g"] ||
                  product.calories ||
                  0}
              </Text>
              <Text>
                Fat: {product.nutriments?.fat_100g || product.fat || 0}g
              </Text>
              <Text>
                Carbs:{" "}
                {product.nutriments?.carbohydrates_100g ||
                  product.carbohydrates ||
                  0}
                g
              </Text>
              <Text>
                Protein:{" "}
                {product.nutriments?.proteins_100g || product.protein || 0}g
              </Text>
              <Text>
                Sugar: {product.nutriments?.sugars_100g || product.sugar || 0}g
              </Text>
              <Text>
                Fiber: {product.nutriments?.fiber_100g || product.fiber || 0}g
              </Text>
            </View>
          )}
          <View style={styles.scanButtonsContainer}>
            <TouchableHighlight
              style={styles.scanAgainButton}
              onPress={resetScanner}
            >
              <Text style={styles.scanAgainText}>Scan again</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={
                product === null
                  ? styles.buttonDisabled
                  : styles.scanAgainButton
              }
              onPress={openAmountModal}
              disabled={product === null ? true : false}
            >
              <Text style={styles.scanAgainText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      )}

      <SaveModal
        modalVisible={modalVisible}
        amount={amount}
        setModalVisible={setModalVisible}
        setAmount={setAmount}
        mealType={mealType}
        setMealType={setMealType}
        handleSave={handleSave}
        showDatepicker={showDatepicker}
        selectedDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 12,
  },
  overlayText: {
    textAlign: "center",
    fontSize: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
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
  buttonDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
