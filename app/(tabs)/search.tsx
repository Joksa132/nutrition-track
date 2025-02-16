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
  const [mealType, setMealType] = useState<string>("");
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
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <Text>Error loading.</Text>
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
    if (amount) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert("Error", "Please enter a valid amount in grams", [
          {
            text: "Ok",
          },
        ]);
        return;
      }

      const calories =
        (product.nutriments?.["energy-kcal"] || 0) * (parsedAmount / 100);
      const fat = (product.nutriments?.fat || 0) * (parsedAmount / 100);
      const carbs =
        (product.nutriments?.carbohydrates || 0) * (parsedAmount / 100);
      const protein =
        (product.nutriments?.proteins || 0) * (parsedAmount / 100);
      const sugar = (product.nutriments?.sugars || 0) * (parsedAmount / 100);
      const fiber = (product.nutriments?.fiber || 0) * (parsedAmount / 100);

      addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        selectedDate,
        mealType,
        product.product_name_en || product.product_name,
        parsedAmount,
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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search for a product</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a product name"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <TouchableHighlight style={styles.buttonContainer} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableHighlight>

      <View style={styles.productContainer}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {searchResults?.products?.map((result) => (
            <View key={result.code} style={styles.item}>
              <Text style={styles.productName}>
                {result.product_name_en || result.product_name} (100g)
              </Text>
              <View style={styles.itemRow}>
                <Text>
                  Calories: {result.nutriments["energy-kcal"]?.toFixed(2) || 0}
                  kcal
                </Text>
                <Text>Fat: {result.nutriments.fat?.toFixed(2) || 0}g</Text>
              </View>
              <View style={styles.itemRow}>
                <Text>
                  Carbs: {result.nutriments.carbohydrates?.toFixed(2) || 0}g
                </Text>
                <Text>Sugar: {result.nutriments.sugars?.toFixed(2) || 0}g</Text>
              </View>
              <View style={styles.itemRow}>
                <Text>
                  Protein: {result.nutriments.proteins?.toFixed(2) || 0}g
                </Text>
                <Text>Fiber: {result.nutriments.fiber?.toFixed(2) || 0}g</Text>
              </View>
              <TouchableHighlight
                style={styles.buttonContainer}
                onPress={() => {
                  setSelectedProduct(result);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableHighlight>
            </View>
          ))}
        </ScrollView>
      </View>

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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  productContainer: {
    marginBottom: 120,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "black",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
});
