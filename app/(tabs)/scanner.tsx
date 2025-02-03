import {
  Text,
  View,
  StyleSheet,
  Button,
  TouchableOpacity,
  TouchableHighlight,
} from "react-native";
import { useState } from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery } from "@tanstack/react-query";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [flashlight, setFlashlight] = useState<boolean>(false);
  const db = useSQLiteContext();

  const fetchProductInfo = async (barcode: string) => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();

    //if no data then fetch from db
    return data.product || null;
  };

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["productInfo", barcode],
    queryFn: () => fetchProductInfo(barcode!),
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
                {product.product_name_en
                  ? product.product_name_en
                  : product.product_name}
              </Text>
              <Text>Calories: {product.nutriments?.["energy-kcal_100g"]}</Text>
              <Text>
                Fat:{" "}
                {product.nutriments?.fat_100g
                  ? product.nutriments?.fat_100g
                  : 0}
                g
              </Text>
              <Text>
                Carbs:{" "}
                {product.nutriments?.carbohydrates_100g
                  ? product.nutriments?.carbohydrates_100g
                  : 0}
                g
              </Text>
              <Text>
                Protein:{" "}
                {product.nutriments?.proteins_100g
                  ? product.nutriments?.proteins_100g
                  : 0}
                g
              </Text>
              <Text>
                Sugar:{" "}
                {product.nutriments?.sugars_100g
                  ? product.nutriments?.sugars_100g
                  : 0}
                g
              </Text>
              <Text>
                Fiber:{" "}
                {product.nutriments?.fiber_100g
                  ? product.nutriments?.fiber_100g
                  : 0}
                g
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
              style={styles.scanAgainButton}
              onPress={resetScanner}
            >
              <Text style={styles.scanAgainText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      )}
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
  scanAgainText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});
