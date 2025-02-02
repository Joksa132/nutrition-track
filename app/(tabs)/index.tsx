import { AuthContext } from "@/components/AuthContext";
import { deleteMeal, fetchFoodInfo } from "@/util/queries";
import { FoodInfoFull } from "@/util/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { useContext } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Alert,
  ScrollView,
} from "react-native";

export default function Index() {
  const auth = useContext(AuthContext);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  const {
    data: foodInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["foodInfo", auth?.user?.id],
    queryFn: () => fetchFoodInfo(auth?.user?.id as string, db),
    enabled: !!auth?.user?.id,
  });

  const { mutate: deleteFoodInfo } = useMutation({
    mutationFn: (mealId: string) => deleteMeal(mealId, db),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
    },
    onError: (error) => {
      console.log("Error deleting meal:", error);
      Alert.alert("Error", "Error deleting meal", [
        {
          text: "Ok",
        },
      ]);
    },
  });

  const handleDelete = (mealId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this meal?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFoodInfo(mealId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading food information.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {foodInfo?.map((row) => (
          <View key={row.id} style={styles.foodItem}>
            <Text style={styles.foodName}>{row.food_name}</Text>
            <Text style={styles.foodDetails}>Meal type: {row.meal_type}</Text>
            <Text style={styles.foodDetails}>Quantity: {row.quantity}g</Text>
            <Text style={styles.foodDetails}>Calories: {row.calories}</Text>
            <Text style={styles.foodDetails}>Fat: {row.fat}g</Text>
            <Text style={styles.foodDetails}>
              Carbohydrates: {row.carbohydrates}g
            </Text>
            <Text style={styles.foodDetails}>Sugar: {row.sugar}g</Text>
            <Text style={styles.foodDetails}>Protein: {row.protein}g</Text>
            <Text style={styles.foodDetails}>Fiber: {row.fiber}g</Text>
            <Text style={styles.foodDetails}>Date: {row.date}</Text>
            <TouchableHighlight
              style={styles.deleteButton}
              onPress={() => handleDelete(row.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableHighlight>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    color: "gray",
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    color: "red",
  },
  foodItem: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  foodName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  foodDetails: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    marginBottom: 5,
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 15,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});
