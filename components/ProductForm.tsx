import { ProductInfo } from "@/util/types";
import { View, Text, ViewStyle, TextStyle, TextInput } from "react-native";

type Styles = {
  section: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  pickerContainer: ViewStyle;
};

type ProductFormProps = {
  styles: Styles;
  productInfo: ProductInfo;
  setProductInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;
};

export default function ProductForm({
  styles,
  productInfo,
  setProductInfo,
}: ProductFormProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Product Name</Text>
      <TextInput
        style={styles.input}
        value={productInfo.productName}
        onChangeText={(text) =>
          setProductInfo((prev) => ({ ...prev, productName: text }))
        }
      />

      <Text style={styles.label}>Calories (100g)</Text>
      <TextInput
        style={styles.input}
        value={productInfo.calories}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            calories: text,
          }))
        }
        inputMode="decimal"
      />

      <Text style={styles.label}>Fat (100g)</Text>
      <TextInput
        style={styles.input}
        value={productInfo.fat}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            fat: text,
          }))
        }
        inputMode="decimal"
      />

      <Text style={styles.label}>Carbohydrates (100g)</Text>
      <TextInput
        style={styles.input}
        value={productInfo.carbohydrates}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            carbohydrates: text,
          }))
        }
        inputMode="decimal"
      />

      <Text style={styles.label}>Sugar (100g)</Text>
      <TextInput
        style={styles.input}
        value={productInfo.sugar}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            sugar: text,
          }))
        }
        inputMode="decimal"
      />

      <Text style={styles.label}>Protein (100g)</Text>
      <TextInput
        style={styles.input}
        value={productInfo.protein}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            protein: text,
          }))
        }
        inputMode="decimal"
      />

      <Text style={styles.label}>Fiber (100g)</Text>
      <TextInput
        style={styles.input}
        value={productInfo.fiber}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            fiber: text,
          }))
        }
        inputMode="decimal"
      />

      <Text style={styles.label}>Barcode</Text>
      <TextInput
        style={styles.input}
        value={productInfo.barcode}
        onChangeText={(text) =>
          setProductInfo((prev) => ({
            ...prev,
            barcode: text,
          }))
        }
        inputMode="decimal"
      />
    </View>
  );
}
