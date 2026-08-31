import SaveModal from "@/components/SaveModal";
import { addMealToDb } from "@/util/queries";
import { OpenFoodFactsProduct } from "@/util/types";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import Ionicons from "@expo/vector-icons/Ionicons";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

type OpenFoodFactsResponse = {
  products: OpenFoodFactsProduct[];
};

type Macros = {
  calories: number;
  fat: number;
  carbohydrates: number;
  sugar: number;
  protein: number;
  fiber: number;
};

type SearchResult = {
  key: string;
  name: string;
  product: OpenFoodFactsProduct;
  macros: Macros;
};

const toNumber = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

const getMacros = (product: OpenFoodFactsProduct): Macros => {
  const n = product?.nutriments ?? {};
  return {
    calories: toNumber(n["energy-kcal_100g"]),
    fat: toNumber(n.fat_100g),
    carbohydrates: toNumber(n.carbohydrates_100g),
    sugar: toNumber(n.sugars_100g),
    protein: toNumber(n.proteins_100g),
    fiber: toNumber(n.fiber_100g),
  };
};

const hasUsableMacros = (m: Macros): boolean =>
  m.calories > 0 || m.fat > 0 || m.carbohydrates > 0 || m.protein > 0;

const prepareResults = (products: OpenFoodFactsProduct[]): SearchResult[] => {
  const seen = new Set<string>();

  return products
    .map((product, i) => ({
      key: product?.code || `row-${i}`,
      name: (product?.product_name_en || product?.product_name || "").trim(),
      product,
      macros: getMacros(product),
    }))
    .filter((x) => {
      if (!x.name || !hasUsableMacros(x.macros)) return false;
      if (seen.has(x.key)) return false;
      seen.add(x.key);
      return true;
    });
};

export default function Search() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submittedTerm, setSubmittedTerm] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
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
  } = useQuery<OpenFoodFactsResponse>({
    queryKey: ["productSearch", submittedTerm],
    queryFn: async ({ signal }) => {
      const url =
        `https://world.openfoodfacts.org/cgi/search.pl?` +
        `search_terms=${encodeURIComponent(submittedTerm)}` +
        `&search_simple=1&action=process&json=1&page_size=100` +
        `&fields=code,product_name,product_name_en,nutriments`;

      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      return { products: Array.isArray(data?.products) ? data.products : [] };
    },
    enabled: !!submittedTerm,
  });

  const results = useMemo(
    () => prepareResults(searchResults?.products ?? []),
    [searchResults],
  );

  const handleSearch = () => {
    const trimmed = searchTerm.trim();
    if (trimmed) setSubmittedTerm(trimmed);
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

  const handleSave = async (product: OpenFoodFactsProduct) => {
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

    const per100g = getMacros(product);
    const scale = validatedData.data.amount / 100;

    try {
      await addMealToDb(
        Crypto.randomUUID(),
        auth?.user?.id as string,
        validatedData.data.selectedDate,
        validatedData.data.mealType,
        product.product_name_en || product.product_name || "Unnamed product",
        validatedData.data.amount,
        parseFloat((per100g.calories * scale).toFixed(2)),
        parseFloat((per100g.fat * scale).toFixed(2)),
        parseFloat((per100g.carbohydrates * scale).toFixed(2)),
        parseFloat((per100g.sugar * scale).toFixed(2)),
        parseFloat((per100g.protein * scale).toFixed(2)),
        parseFloat((per100g.fiber * scale).toFixed(2)),
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a product..."
          placeholderTextColor={colors.textFaint}
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableHighlight
          style={[
            styles.searchButton,
            !searchTerm.trim() && styles.searchButtonDisabled,
          ]}
          underlayColor={colors.accentPress}
          onPress={handleSearch}
          disabled={!searchTerm.trim()}
        >
          <Ionicons
            name="search"
            size={20}
            color={!searchTerm.trim() ? colors.textFaint : "#FFFFFF"}
          />
        </TouchableHighlight>
      </View>

      {isLoading && <Loading message="Searching..." />}
      {isError && (
        <Text style={commonStyles.errorText}>
          Error loading search results.
        </Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isLoading || isError ? null : (
            <Text style={commonStyles.emptyText}>
              {submittedTerm
                ? `No results for "${submittedTerm}".`
                : "Search the Open Food Facts database."}
            </Text>
          )
        }
        renderItem={({ item: { name, product, macros } }) => (
          <View style={commonStyles.card}>
            <Text style={styles.productName}>{name}</Text>
            <Text style={styles.productSubtext}>per 100g</Text>
            <View style={styles.separator} />
            <View style={commonStyles.macroGrid}>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Calories</Text>
                <Text style={commonStyles.macroCellValue}>
                  {macros.calories.toFixed(0)}
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Fat</Text>
                <Text style={commonStyles.macroCellValue}>
                  {macros.fat.toFixed(1)}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                <Text style={commonStyles.macroCellValue}>
                  {macros.carbohydrates.toFixed(1)}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                <Text style={commonStyles.macroCellValue}>
                  {macros.sugar.toFixed(1)}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Protein</Text>
                <Text style={commonStyles.macroCellValue}>
                  {macros.protein.toFixed(1)}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Fiber</Text>
                <Text style={commonStyles.macroCellValue}>
                  {macros.fiber.toFixed(1)}g
                </Text>
              </View>
            </View>
            <TouchableHighlight
              style={styles.saveButton}
              underlayColor={colors.accentPress}
              onPress={() => {
                setSelectedProduct(product);
                setModalVisible(true);
              }}
            >
              <Text style={commonStyles.btnPrimaryText}>Save</Text>
            </TouchableHighlight>
          </View>
        )}
      />

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
    backgroundColor: colors.bg,
    padding: space.lg,
  },
  searchRow: {
    flexDirection: "row",
    gap: space.sm,
    marginBottom: space.lg,
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    color: colors.text,
    fontFamily: type.body.fontFamily,
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  productName: {
    ...type.h2,
    fontSize: 16,
    marginBottom: 2,
  },
  productSubtext: {
    ...type.label,
    fontSize: 10,
    marginBottom: space.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: space.sm,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    alignItems: "center",
    marginTop: space.md,
  },
});
