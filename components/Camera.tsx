import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useRef, useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  type CameraPosition,
  type Point,
} from "react-native-vision-camera";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import * as ImageManipulator from "expo-image-manipulator";

type CameraProps = {
  styles: Record<string, any>;
  mode: "barcode" | "label";
  scanned: boolean;
  busy: boolean;
  onBarcodeScanned: (barcode: string) => void;
  onLabelCaptured: (base64Jpeg: string) => void;
};

export default function ScannerCamera({
  styles,
  mode,
  scanned,
  busy,
  onBarcodeScanned,
  onLabelCaptured,
}: CameraProps) {
  const [torch, setTorch] = useState<"on" | "off">("off");
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>("back");
  const device = useCameraDevice(cameraPosition);
  const cameraRef = useRef<Camera>(null);

  const codeScanner = useCodeScanner({
    codeTypes: ["ean-13", "ean-8", "upc-a"],
    onCodeScanned: (codes) => {
      if (mode !== "barcode" || scanned || codes.length === 0) return;
      const codeValue = codes[0].value;
      if (codeValue) onBarcodeScanned(codeValue);
    },
  });

  const toggleCameraFacing = () => {
    setCameraPosition((current) => (current === "back" ? "front" : "back"));
  };

  const toggleTorch = () => {
    setTorch((current) => (current === "on" ? "off" : "on"));
  };

  const captureLabel = async () => {
    const camera = cameraRef.current;
    if (!camera || busy) return;

    const photo = await camera.takePhoto({
      flash: torch === "on" ? "on" : "off",
      enableShutterSound: false,
    });
    const uri = photo.path.startsWith("file://")
      ? photo.path
      : `file://${photo.path}`;

    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    if (resized.base64) onLabelCaptured(resized.base64);
  };

  const handleFocus = useCallback(
    (point: Point) => {
      const camera = cameraRef.current;
      if (!camera || !device?.supportsFocus) return;

      camera.focus(point).catch(() => {});
    },
    [device?.supportsFocus],
  );

  const tapGesture = Gesture.Tap().onEnd(({ x, y }) => {
    runOnJS(handleFocus)({ x, y });
  });

  if (!device) return null;

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={{ flex: 1 }}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!scanned}
          photo={mode === "label"}
          codeScanner={mode === "barcode" ? codeScanner : undefined}
          torch={torch}
          resizeMode="cover"
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleTorch}>
            <MaterialIcons
              name={torch === "on" ? "flashlight-off" : "flashlight-on"}
              size={30}
              color="white"
            />
          </TouchableOpacity>
          {mode === "label" && (
            <TouchableOpacity
              style={styles.button}
              onPress={captureLabel}
              disabled={busy}
            >
              <MaterialIcons
                name="camera"
                size={54}
                color={busy ? "rgba(255,255,255,0.4)" : "white"}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <FontAwesome6 name="arrows-rotate" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </GestureDetector>
  );
}
