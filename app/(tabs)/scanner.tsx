import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableHighlight,
  Alert,
  Linking,
} from "react-native";
import { useContext, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMealToDb,
  addProductToTemplates,
  getProductFromDb,
} from "@/util/queries";
import { readNutritionLabel } from "@/util/ai";
import { AuthContext } from "@/components/AuthContext";
import * as Crypto from "expo-crypto";
import SaveModal from "@/components/SaveModal";
import TemplateFormModal, {
  TemplateFormValues,
} from "@/components/TemplateFormModal";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { SaveModalSchema } from "@/util/validations";
import Loading from "@/components/Loading";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let useCameraPermission: any;
let ScannerCamera: any;

if (!isExpoGo) {
  useCameraPermission =
    require("react-native-vision-camera").useCameraPermission;
  ScannerCamera = require("@/components/Camera").default;
}

type ScanMode = "barcode" | "label";

export default function Scanner() {
  const cameraPermission = isExpoGo ? null : useCameraPermission();
  const [mode, setMode] = useState<ScanMode>("barcode");
  const [scanned, setScanned] = useState<boolean>(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [labelProduct, setLabelProduct] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("breakfast");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [templateModalVisible, setTemplateModalVisible] =
    useState<boolean>(false);
  const [templateInitial, setTemplateInitial] = useState<TemplateFormValues>({
    productName: "",
    calories: "0",
    fat: "0",
    carbohydrates: "0",
    sugar: "0",
    protein: "0",
    fiber: "0",
  });
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext);

  const fetchProductInfo = async (barcode: string) => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${barcode}.json`,
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

  const activeProduct = labelProduct ?? product;

  const productLabel = activeProduct
    ? activeProduct.product_name_en || activeProduct.product_name || ""
    : "";
  const canSave = Boolean(activeProduct) && productLabel.trim().length > 0;

  const handleBarcodeScanned = (barcodeData: string) => {
    setScanned(true);
    setBarcode(barcodeData);
    refetch();
  };

  const handleLabelCaptured = async (base64Jpeg: string) => {
    setScanned(true);
    setAnalyzing(true);
    try {
      const reading = await readNutritionLabel(base64Jpeg);
      setLabelProduct({
        product_name: reading.productName,
        nutriments: {
          "energy-kcal_100g": reading.calories,
          fat_100g: reading.fat,
          carbohydrates_100g: reading.carbohydrates,
          sugars_100g: reading.sugar,
          proteins_100g: reading.protein,
          fiber_100g: reading.fiber,
        },
      });
    } catch (error) {
      console.log("Error reading label:", error);
      Alert.alert(
        "Could not read the label",
        "Try again with the nutrition table filling more of the frame and better lighting.",
      );
      resetScanner();
    } finally {
      setAnalyzing(false);
    }
  };

  const setLabelName = (name: string) => {
    setLabelProduct((prev: any) => (prev ? { ...prev, product_name: name } : prev));
  };

  const switchMode = (next: ScanMode) => {
    resetScanner();
    setMode(next);
  };

  const handlePermissionRequest = async () => {
    if (!cameraPermission) return;
    const granted = await cameraPermission.requestPermission();
    if (!granted) {
      Alert.alert(
        "Permission Required",
        "Camera access is required to scan barcodes. Please enable it in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setBarcode(null);
    setLabelProduct(null);
    setAmount("");
  };

  if (isExpoGo) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Scanner is not available in Expo Go. Use a development build to scan
          barcodes.
        </Text>
      </View>
    );
  }

  if (!cameraPermission?.hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <TouchableHighlight
          style={[commonStyles.btnPrimary, styles.permissionButton]}
          underlayColor={colors.accentPress}
          onPress={handlePermissionRequest}
        >
          <Text style={commonStyles.btnPrimaryText}>Grant Camera Access</Text>
        </TouchableHighlight>
      </View>
    );
  }

  const handleSave = async () => {
    const validatedData = SaveModalSchema.safeParse({
      amount,
      mealType,
      selectedDate,
    });

    if (!validatedData.success) {
      const errorMessages = validatedData.error.errors.map(
        (error) => error.message,
      );
      Alert.alert("Validation Error", errorMessages.join("\n"));
      return;
    }

    if (activeProduct) {
      const calories =
        (activeProduct.nutriments?.["energy-kcal_100g"] || activeProduct.calories || 0) *
        (validatedData.data.amount / 100);
      const fat =
        (activeProduct.nutriments?.fat_100g || activeProduct.fat || 0) *
        (validatedData.data.amount / 100);
      const carbs =
        (activeProduct.nutriments?.carbohydrates_100g || activeProduct.carbohydrates || 0) *
        (validatedData.data.amount / 100);
      const protein =
        (activeProduct.nutriments?.proteins_100g || activeProduct.protein || 0) *
        (validatedData.data.amount / 100);
      const sugar =
        (activeProduct.nutriments?.sugars_100g || activeProduct.sugar || 0) *
        (validatedData.data.amount / 100);
      const fiber =
        (activeProduct.nutriments?.fiber_100g || activeProduct.fiber || 0) *
        (validatedData.data.amount / 100);

      try {
        await addMealToDb(
          Crypto.randomUUID(),
          auth?.user?.id as string,
          validatedData.data.selectedDate,
          validatedData.data.mealType,
          activeProduct.product_name_en || activeProduct.product_name,
          validatedData.data.amount,
          parseFloat(calories.toFixed(2)),
          parseFloat(fat.toFixed(2)),
          parseFloat(carbs.toFixed(2)),
          parseFloat(sugar.toFixed(2)),
          parseFloat(protein.toFixed(2)),
          parseFloat(fiber.toFixed(2)),
          db,
        );
      } catch (error) {
        console.log("Error saving meal:", error);
        Alert.alert("Error", "Failed to save meal.");
        return;
      }

      Alert.alert("Success", "Successfully saved this meal");
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
      setModalVisible(false);
      resetScanner();
    }
  };

  const handleSaveAsTemplate = () => {
    if (!activeProduct) return;
    setTemplateInitial({
      productName: activeProduct.product_name_en || activeProduct.product_name || "",
      calories: String(
        activeProduct.nutriments?.["energy-kcal_100g"] || activeProduct.calories || 0,
      ),
      fat: String(activeProduct.nutriments?.fat_100g || activeProduct.fat || 0),
      carbohydrates: String(
        activeProduct.nutriments?.carbohydrates_100g || activeProduct.carbohydrates || 0,
      ),
      sugar: String(activeProduct.nutriments?.sugars_100g || activeProduct.sugar || 0),
      protein: String(
        activeProduct.nutriments?.proteins_100g || activeProduct.protein || 0,
      ),
      fiber: String(activeProduct.nutriments?.fiber_100g || activeProduct.fiber || 0),
    });
    setTemplateModalVisible(true);
  };

  const handleTemplateSubmit = async (values: {
    productName: string;
    calories: number;
    fat: number;
    carbohydrates: number;
    sugar: number;
    protein: number;
    fiber: number;
  }) => {
    try {
      await addProductToTemplates(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        values.productName,
        values.calories,
        values.fat,
        values.carbohydrates,
        values.sugar,
        values.protein,
        values.fiber,
        db,
      );
      Alert.alert("Success", "Product saved as template.");
      queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
      setTemplateModalVisible(false);
    } catch (error) {
      console.log("Error saving template:", error);
      Alert.alert("Error", "Failed to save template.");
    }
  };

  const openAmountModal = () => {
    setModalVisible(true);
  };

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(selectedDate),
      onChange: (_e, selectedDate) => {
        if (!selectedDate) return;
        const convertedDate = selectedDate.toISOString().split("T")[0];
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
        mode={mode}
        scanned={scanned}
        busy={analyzing}
        onBarcodeScanned={handleBarcodeScanned}
        onLabelCaptured={handleLabelCaptured}
      />

      <View style={styles.modeSwitch}>
        {(["barcode", "label"] as const).map((value) => {
          const active = mode === value;
          return (
            <TouchableHighlight
              key={value}
              style={[styles.modeItem, active && styles.modeItemActive]}
              underlayColor={colors.surfaceAlt}
              onPress={() => switchMode(value)}
            >
              <Text style={active ? styles.modeTextActive : styles.modeText}>
                {value === "barcode" ? "Barcode" : "Label"}
              </Text>
            </TouchableHighlight>
          );
        })}
      </View>

      {scanned && (
        <View style={styles.overlay}>
          {(isLoading || analyzing) && (
            <Loading message={analyzing ? "Reading label..." : "Loading..."} />
          )}
          {isError && (
            <Text style={styles.overlayText}>
              Error fetching product information.
            </Text>
          )}
          {activeProduct === null && (
            <Text style={styles.overlayText}>Product not found.</Text>
          )}
          {activeProduct && (
            <View>
              {labelProduct ? (
                <TextInput
                  style={styles.nameInput}
                  value={labelProduct.product_name}
                  onChangeText={setLabelName}
                  placeholder="Name this product"
                  placeholderTextColor={colors.textFaint}
                  autoFocus={!labelProduct.product_name}
                />
              ) : (
                <Text style={styles.productName}>
                  {activeProduct.product_name_en || activeProduct.product_name}
                </Text>
              )}
              <Text style={styles.productSubtext}>per 100g</Text>
              <View style={[commonStyles.macroGrid, { marginBottom: 4 }]}>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Calories</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {activeProduct.nutriments?.["energy-kcal_100g"] ||
                      activeProduct.calories ||
                      0}
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Fat</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {activeProduct.nutriments?.fat_100g || activeProduct.fat || 0}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {activeProduct.nutriments?.carbohydrates_100g ||
                      activeProduct.carbohydrates ||
                      0}
                    g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {activeProduct.nutriments?.sugars_100g || activeProduct.sugar || 0}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Protein</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {activeProduct.nutriments?.proteins_100g || activeProduct.protein || 0}g
                  </Text>
                </View>
                <View style={commonStyles.macroCell}>
                  <Text style={commonStyles.macroCellLabel}>Fiber</Text>
                  <Text style={commonStyles.macroCellValue}>
                    {activeProduct.nutriments?.fiber_100g || activeProduct.fiber || 0}g
                  </Text>
                </View>
              </View>
            </View>
          )}
          <View style={styles.scanButtonsContainer}>
            <TouchableHighlight
              style={styles.outlineButton}
              underlayColor={colors.surfaceAlt}
              onPress={resetScanner}
            >
              <Text style={styles.outlineButtonText}>Scan again</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={
                !canSave
                  ? styles.primaryButtonDisabled
                  : styles.primaryButton
              }
              underlayColor={colors.accentPress}
              onPress={openAmountModal}
              disabled={!canSave}
            >
              <Text
                style={
                  !canSave
                    ? styles.outlineButtonTextDisabled
                    : styles.primaryButtonText
                }
              >
                Save
              </Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={
                !canSave
                  ? styles.outlineButtonDisabled
                  : styles.outlineButton
              }
              underlayColor={colors.surfaceAlt}
              onPress={handleSaveAsTemplate}
              disabled={!canSave}
            >
              <Text
                style={
                  !canSave
                    ? styles.outlineButtonTextDisabled
                    : styles.outlineButtonText
                }
              >
                Template
              </Text>
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

      <TemplateFormModal
        visible={templateModalVisible}
        setVisible={setTemplateModalVisible}
        title="Save Template"
        initial={templateInitial}
        onSubmit={handleTemplateSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  message: {
    ...type.body,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  permissionButton: {
    marginHorizontal: space.xl,
  },
  nameInput: {
    ...type.h1,
    fontSize: 20,
    marginBottom: 2,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  modeSwitch: {
    position: "absolute",
    top: space.xl,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
  },
  modeItem: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
  },
  modeItemActive: {
    backgroundColor: colors.accent,
  },
  modeText: {
    ...type.button,
    fontSize: 13,
    color: colors.textMuted,
  },
  modeTextActive: {
    ...type.button,
    fontSize: 13,
    color: "#FFFFFF",
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    backgroundColor: "transparent",
    marginBottom: space.md,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  overlayText: {
    ...type.body,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: space.sm,
  },
  productName: {
    ...type.h1,
    fontSize: 20,
    marginBottom: 2,
  },
  productSubtext: {
    ...type.label,
    fontSize: 10,
    marginBottom: space.sm,
  },
  scanButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    ...type.button,
    fontSize: 14,
    color: "#FFFFFF",
  },
  outlineButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  outlineButtonDisabled: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  outlineButtonText: {
    ...type.button,
    fontSize: 14,
    color: colors.textMuted,
  },
  outlineButtonTextDisabled: {
    ...type.button,
    fontSize: 14,
    color: colors.textFaint,
  },
});
