import {
  Text,
  View,
  StyleSheet,
  Button,
  TouchableOpacity,
  TouchableHighlight,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useContext, useState } from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { addMealToDb, getProductFromDb } from "@/util/queries";
import { Picker } from "@react-native-picker/picker";
import { AuthContext } from "@/components/AuthContext";
import * as Crypto from "expo-crypto";
import SaveModal from "@/components/SaveModal";

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [flashlight, setFlashlight] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setBarcode(data);
    refetch();
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcode(null);
    setAmount("");
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlashlight = () => {
    setFlashlight((prev) => !prev);
  };

  const handleSave = () => {
    if (product && amount) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert("Error", "Please enter a valid amount in grams", [
          {
            text: "Ok",
          },
        ]);
        return;
      }

      const currentDate = new Date().toISOString().split("T")[0];

      const calories =
        (product.nutriments?.["energy-kcal_100g"] || product.calories) *
        (parsedAmount / 100);
      const fat =
        (product.nutriments?.fat_100g || product.fat) * (parsedAmount / 100);
      const carbs =
        (product.nutriments?.carbohydrates_100g || product.carbohydrates) *
        (parsedAmount / 100);
      const protein =
        (product.nutriments?.proteins_100g || product.protein) *
        (parsedAmount / 100);
      const sugar =
        (product.nutriments?.sugars_100g || product.sugar) *
        (parsedAmount / 100);
      const fiber =
        (product.nutriments?.fiber_100g || product.fiber) *
        (parsedAmount / 100);

      addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        currentDate,
        mealType,
        product.product_name_en || product.product_name,
        parsedAmount,
        calories,
        fat,
        carbs,
        sugar,
        protein,
        fiber,
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a", "ean13", "ean8"],
        }}
        enableTorch={flashlight}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleFlashlight}>
            {flashlight ? (
              <MaterialIcons name="flashlight-off" size={30} color="white" />
            ) : (
              <MaterialIcons name="flashlight-on" size={30} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <FontAwesome6 name="arrows-rotate" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>

      {scanned && (
        <View style={styles.overlay}>
          {isLoading && <Text style={styles.overlayText}>Loading...</Text>}
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
                {product.nutriments?.["energy-kcal_100g"] || product.calories}
              </Text>
              <Text>Fat: {product.nutriments?.fat_100g || product.fat}g</Text>
              <Text>
                Carbs:{" "}
                {product.nutriments?.carbohydrates_100g ||
                  product.carbohydrates}
                g
              </Text>
              <Text>
                Protein: {product.nutriments?.proteins_100g || product.protein}g
              </Text>
              <Text>
                Sugar: {product.nutriments?.sugars_100g || product.sugar}g
              </Text>
              <Text>
                Fiber: {product.nutriments?.fiber_100g || product.fiber}g
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
        styles={styles}
        modalVisible={modalVisible}
        amount={amount}
        setModalVisible={setModalVisible}
        setAmount={setAmount}
        mealType={mealType}
        setMealType={setMealType}
        handleSave={handleSave}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: "white",
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
});
