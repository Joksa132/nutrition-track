import { Text, View, StyleSheet, Button, TouchableOpacity } from "react-native";
import { useState } from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery } from "@tanstack/react-query";

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const db = useSQLiteContext();

  const fetchProductInfo = async (barcode: string) => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();
    console.log(data.product);
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

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["upc_a", "ean13", "ean8"],
        }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
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
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.product_name}</Text>
              <Text>Calories: {product.nutriments?.energy_kcal_100g}</Text>
              <Text>Fat: {product.nutriments?.fat_100g}g</Text>
              <Text>Carbs: {product.nutriments?.carbohydrates_100g}g</Text>
              <Text>Protein: {product.nutriments?.proteins_100g}g</Text>
              <Text>Sugar: {product.nutriments?.sugars_100g}g</Text>
              <Text>Fiber: {product.nutriments?.fiber_100g}g</Text>
            </View>
          )}
          <Button title="Scan Again" onPress={resetScanner} />
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
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
  },
  overlayText: {
    textAlign: "center",
    fontSize: 16,
  },
  productInfo: {
    marginTop: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
