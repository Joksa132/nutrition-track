import SaveModal from "@/components/SaveModal";
import { addMealToDb } from "@/util/queries";
import { OpenFoodFactsProduct } from "@/util/types";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { AuthContext } from "@/components/AuthContext";
import { SaveModalSchema } from "@/util/validations";
import Loading from "@/components/Loading";

type OpenFoodFactsResponse = {
  products: OpenFoodFactsProduct[];
};

export default function Search() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("breakfast");
  const [selectedProduct, setSelectedProduct] =
    useState<OpenFoodFactsProduct | null>(null);
  const db = useSQLiteContext();
  const auth = useContext(AuthContext);
  const queryClient = useQueryClient();

  const {
    data: searchResults,
    isLoading,
    isError,
    refetch,
  } = useQuery<OpenFoodFactsResponse>({
    queryKey: ["productSearch", searchTerm],
    queryFn: async () => {
      if (!searchTerm) {
        return { products: [] };
      }

      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        searchTerm
      )}&search_simple=1&action=process&json=1&page_size=40`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: false,
  });

  if (isLoading) {
    return <Loading message="Searching..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading.</Text>
      </View>
    );
  }

  const handleSearch = () => {
    refetch();
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

  const handleSave = (product: OpenFoodFactsProduct) => {
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

    const calories =
      (product.nutriments?.["energy-kcal_100g"] || 0) *
      (validatedData.data.amount / 100);
    const fat =
      (product.nutriments?.fat_100g || 0) * (validatedData.data.amount / 100);
    const carbs =
      (product.nutriments?.carbohydrates_100g || 0) *
      (validatedData.data.amount / 100);
    const protein =
      (product.nutriments?.proteins_100g || 0) * (validatedData.data.amount / 100);
    const sugar =
      (product.nutriments?.sugars_100g || 0) * (validatedData.data.amount / 100);
    const fiber =
      (product.nutriments?.fiber_100g || 0) * (validatedData.data.amount / 100);

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
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a product..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableHighlight
          style={
            !searchTerm.trim()
              ? styles.searchButtonDisabled
              : styles.searchButton
          }
          underlayColor="#333"
          onPress={handleSearch}
          disabled={!searchTerm.trim()}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableHighlight>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {searchResults?.products?.map((result) => (
          <View key={result.code} style={styles.productCard}>
            <Text style={styles.productName}>
              {result.product_name_en || result.product_name}
            </Text>
            <Text style={styles.productSubtext}>per 100g</Text>
            <View style={styles.separator} />
            <View style={styles.macroGrid}>
              <View style={styles.macroCell}>
                <Text style={styles.macroCellLabel}>Calories</Text>
                <Text style={styles.macroCellValue}>
                  {result.nutriments["energy-kcal_100g"]?.toFixed(0) || 0} kcal
                </Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroCellLabel}>Protein</Text>
                <Text style={styles.macroCellValue}>
                  {result.nutriments.proteins_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroCellLabel}>Carbs</Text>
                <Text style={styles.macroCellValue}>
                  {result.nutriments.carbohydrates_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroCellLabel}>Fat</Text>
                <Text style={styles.macroCellValue}>
                  {result.nutriments.fat_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroCellLabel}>Sugar</Text>
                <Text style={styles.macroCellValue}>
                  {result.nutriments.sugars_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={styles.macroCell}>
                <Text style={styles.macroCellLabel}>Fiber</Text>
                <Text style={styles.macroCellValue}>
                  {result.nutriments.fiber_100g?.toFixed(1) || 0}g
                </Text>
              </View>
            </View>
            <TouchableHighlight
              style={styles.saveButton}
              underlayColor="#333"
              onPress={() => {
                setSelectedProduct(result);
                setModalVisible(true);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableHighlight>
          </View>
        ))}
      </ScrollView>

      {selectedProduct && (
        <SaveModal
          amount={amount}
          setAmount={setAmount}
          mealType={mealType}
          setMealType={setMealType}
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          selectedDate={selectedDate}
          showDatepicker={showDatepicker}
          handleSave={() => {
            handleSave(selectedProduct);
            setSelectedProduct(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "white",
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: "black",
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  productSubtext: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#e8e8e8",
    marginBottom: 8,
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  macroCell: {
    width: "33.33%",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  macroCellLabel: {
    fontSize: 11,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 1,
  },
  macroCellValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "black",
  },
  saveButton: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
    marginTop: 20,
  },
});
