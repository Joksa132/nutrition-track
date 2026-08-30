import SaveModal from "@/components/SaveModal";
import { addMealToDb } from "@/util/queries";
import { OpenFoodFactsProduct } from "@/util/types";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
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
import Ionicons from "@expo/vector-icons/Ionicons";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

type OpenFoodFactsResponse = {
  products: OpenFoodFactsProduct[];
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const scoreProduct = (product: OpenFoodFactsProduct, query: string): number => {
  const rawName = product.product_name_en || product.product_name || "";
  const name = rawName.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (!name || !q) return -1;

  const qAlt = q.endsWith("s") ? q.slice(0, -1) : q + "s";
  if (name === q) return 1000;
  if (name === qAlt) return 950;

  const words = name.split(/[\s,\-()/]+/).filter(Boolean);
  if (words[0] === q) return 900;
  if (words[0] === qAlt) return 880;
  if (words.includes(q)) return 700;
  if (words.includes(qAlt)) return 680;

  if (name.startsWith(q)) return 500;
  if (name.startsWith(qAlt)) return 480;

  const wb = new RegExp(`\\b${escapeRegex(q)}\\b`, "i");
  if (wb.test(name)) return 300;

  if (name.includes(q)) return 100;
  if (name.includes(qAlt)) return 80;
  return -1;
};

const rankProducts = (
  products: OpenFoodFactsProduct[],
  query: string,
): OpenFoodFactsProduct[] => {
  return products
    .map((p) => ({
      p,
      score: scoreProduct(p, query),
      len: (p.product_name_en || p.product_name || "").length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.len - b.len)
    .map((x) => x.p);
};

export default function Search() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submittedTerm, setSubmittedTerm] = useState<string>("");
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
  } = useQuery<OpenFoodFactsResponse>({
    queryKey: ["productSearch", submittedTerm],
    queryFn: async ({ signal }) => {
      const url =
        `https://world.openfoodfacts.org/cgi/search.pl?` +
        `search_terms=${encodeURIComponent(submittedTerm)}` +
        `&search_simple=1&action=process&json=1&page_size=40`;

      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    },
    enabled: !!submittedTerm,
  });

  const rankedProducts = useMemo(() => {
    if (!searchResults?.products || !submittedTerm) return [];
    return rankProducts(searchResults.products, submittedTerm);
  }, [searchResults, submittedTerm]);

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

    try {
      await addMealToDb(
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

      {!isLoading && !isError && rankedProducts.length === 0 && (
        <Text style={commonStyles.emptyText}>
          {submittedTerm
            ? `No results for "${submittedTerm}".`
            : "Search the Open Food Facts database."}
        </Text>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        {rankedProducts.map((result) => (
          <View key={result.code} style={commonStyles.card}>
            <Text style={styles.productName}>
              {result.product_name_en || result.product_name}
            </Text>
            <Text style={styles.productSubtext}>per 100g</Text>
            <View style={styles.separator} />
            <View style={commonStyles.macroGrid}>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Calories</Text>
                <Text style={commonStyles.macroCellValue}>
                  {result.nutriments["energy-kcal_100g"]?.toFixed(0) || 0}
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Fat</Text>
                <Text style={commonStyles.macroCellValue}>
                  {result.nutriments.fat_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                <Text style={commonStyles.macroCellValue}>
                  {result.nutriments.carbohydrates_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                <Text style={commonStyles.macroCellValue}>
                  {result.nutriments.sugars_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Protein</Text>
                <Text style={commonStyles.macroCellValue}>
                  {result.nutriments.proteins_100g?.toFixed(1) || 0}g
                </Text>
              </View>
              <View style={commonStyles.macroCell}>
                <Text style={commonStyles.macroCellLabel}>Fiber</Text>
                <Text style={commonStyles.macroCellValue}>
                  {result.nutriments.fiber_100g?.toFixed(1) || 0}g
                </Text>
              </View>
            </View>
            <TouchableHighlight
              style={styles.saveButton}
              underlayColor={colors.accentPress}
              onPress={() => {
                setSelectedProduct(result);
                setModalVisible(true);
              }}
            >
              <Text style={commonStyles.btnPrimaryText}>Save</Text>
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
