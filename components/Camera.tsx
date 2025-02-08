import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraType, CameraView } from "expo-camera";
import { useState } from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";

type Styles = {
  camera: ViewStyle;
  buttonContainer: ViewStyle;
  button: ViewStyle;
};

type CameraProps = {
  styles: Styles;
  scanned: boolean;
  handleBarCodeScanned: ({ data }: { data: string }) => void;
};

export default function Camera({
  styles,
  scanned,
  handleBarCodeScanned,
}: CameraProps) {
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashlight, setFlashlight] = useState<boolean>(false);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlashlight = () => {
    setFlashlight((prev) => !prev);
  };

  return (
    <CameraView
      style={styles.camera}
      facing={facing}
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ["upc_a", "ean13", "ean8"],
      }}
      enableTorch={flashlight}
      autofocus="on"
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
  );
}
