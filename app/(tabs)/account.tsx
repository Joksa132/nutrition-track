import { AuthContext } from "@/components/AuthContext";
import { useContext, useState } from "react";
import {
  Text,
  View,
  Alert,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
} from "react-native";
import * as Updates from "expo-updates";
import EditUserInfoModal from "@/components/EditUserInfoModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMealToDb, deleteTemplate, getAllTemplates } from "@/util/queries";
import { useSQLiteContext } from "expo-sqlite";
import { ProductTemplate } from "@/util/types";
import * as Crypto from "expo-crypto";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import SaveModal from "@/components/SaveModal";

export default function Account() {
  const auth = useContext(AuthContext);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [templateModalVisible, setTemplateModalVisible] =
    useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("breakfast");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProductTemplate | null>(null);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  const {
    data: productTemplates,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["templateInfo", auth?.user?.id],
    queryFn: async () => {
      if (!auth?.user?.id) {
        return [];
      }

      const templates = await getAllTemplates(auth.user.id, db);

      if (!templates) {
        console.error("Failed to fetch templates from database");
        return [];
      }
      return templates as ProductTemplate[];
    },
  });

  const { mutate: deleteProductTemplate } = useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId, db),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
      Alert.alert("Success", "Template deleted successfully.");
    },
    onError: (error: Error) => {
      console.error("Error deleting template:", error);
      Alert.alert("Error", "Failed to delete template.");
    },
  });

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: () => auth?.logout(),
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert("Update Available", "Downloading update...");
        await Updates.fetchUpdateAsync();
        Alert.alert(
          "Update Ready",
          "The app will restart to apply the update.",
          [{ text: "Restart", onPress: () => Updates.reloadAsync() }]
        );
      } else {
        Alert.alert("Up to Date", "You are running the latest version.");
      }
    } catch (error) {
      Alert.alert(
        "Update Check Failed",
        "Could not check for updates. Make sure you are using a production build."
      );
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleEditInfo = () => {
    if (auth?.user) {
      setEditModalVisible(true);
    } else {
      Alert.alert("Error", "User not logged in.");
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this product template?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProductTemplate(templateId);
            queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(selectedDate),
      onChange: (e, selectedDateValue) => {
        const convertedDate = selectedDateValue!.toISOString().split("T")[0];
        setSelectedDate(convertedDate);
      },
      mode: "date",
      is24Hour: true,
    });
  };

  const handleAddTemplateMeal = async () => {
    if (!selectedTemplate) {
      Alert.alert("Error", "No template selected.");
      return;
    }

    if (!amount) {
      Alert.alert("Error", "Amount cannot be empty.");
      return;
    }

    const id = Crypto.randomUUID();
    const amountValue = parseFloat(amount);

    try {
      await addMealToDb(
        id,
        auth?.user?.id as string,
        selectedDate,
        mealType,
        selectedTemplate.product_name,
        amountValue,
        selectedTemplate.calories * (amountValue / 100),
        selectedTemplate.fat * (amountValue / 100),
        selectedTemplate.carbohydrates * (amountValue / 100),
        selectedTemplate.sugar * (amountValue / 100),
        selectedTemplate.protein * (amountValue / 100),
        selectedTemplate.fiber * (amountValue / 100),
        db
      );
      Alert.alert(
        "Success",
        `Added ${selectedTemplate.product_name} to today's meal list.`
      );
      setTemplateModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
    } catch (error) {
      console.error("Error adding meal to database:", error);
      Alert.alert(
        "Error",
        `Failed to add ${selectedTemplate.product_name} to today's meal list.`
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome, {auth?.user?.username}!
          </Text>
          <Text style={styles.subText}>Manage your account settings here.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{auth?.user?.username}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{auth?.user?.age}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Height:</Text>
            <Text style={styles.infoValue}>{auth?.user?.height} cm</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>{auth?.user?.weight} kg</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Activity level:</Text>
            <Text style={styles.infoValue}>
              {auth?.user?.activityLevel} active
            </Text>
          </View>
        </View>

        <TouchableHighlight
          style={styles.logoutButton}
          onPress={handleEditInfo}
        >
          <Text style={styles.logoutButtonText}>Edit personal info</Text>
        </TouchableHighlight>

        <TouchableHighlight style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.logoutButton}
          onPress={handleCheckForUpdates}
          disabled={isCheckingUpdates}
        >
          <Text style={styles.logoutButtonText}>
            {isCheckingUpdates ? "Checking..." : "Check for Updates"}
          </Text>
        </TouchableHighlight>

        <View style={(styles.section, { marginTop: 10 })}>
          <Text style={styles.sectionTitle}>Product Templates</Text>
          {isLoading ? (
            <Text>Loading product templates...</Text>
          ) : isError ? (
            <Text>Error loading product templates: {error.message}</Text>
          ) : !productTemplates || productTemplates.length === 0 ? (
            <Text>No product templates saved.</Text>
          ) : (
            productTemplates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <Text style={styles.templateName}>{template.product_name}</Text>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Calories:</Text>
                  <Text style={styles.infoValue}>{template.calories} kcal</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Fat:</Text>
                  <Text style={styles.infoValue}>{template.fat} g</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Carbs:</Text>
                  <Text style={styles.infoValue}>
                    {template.carbohydrates} g
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Sugar:</Text>
                  <Text style={styles.infoValue}>{template.sugar} g</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Protein:</Text>
                  <Text style={styles.infoValue}>{template.protein} g</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Fiber:</Text>
                  <Text style={styles.infoValue}>{template.fiber} g</Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableHighlight
                    style={styles.logoutButton}
                    onPress={() => {
                      setSelectedTemplate(template);
                      setTemplateModalVisible(true);
                    }}
                  >
                    <Text style={styles.logoutButtonText}>Save</Text>
                  </TouchableHighlight>
                  <TouchableHighlight
                    style={styles.logoutButton}
                    onPress={() => handleDeleteTemplate(template.id)}
                  >
                    <Text style={styles.logoutButtonText}>Delete</Text>
                  </TouchableHighlight>
                </View>
              </View>
            ))
          )}
        </View>

        <EditUserInfoModal
          user={auth?.user!}
          setUser={auth?.setUser!}
          visible={editModalVisible}
          setModalVisible={setEditModalVisible}
        />

        <SaveModal
          modalVisible={templateModalVisible}
          setModalVisible={setTemplateModalVisible}
          amount={amount}
          setAmount={setAmount}
          mealType={mealType}
          setMealType={setMealType}
          handleSave={handleAddTemplateMeal}
          showDatepicker={showDatepicker}
          selectedDate={selectedDate}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    marginTop: 5,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  infoContainer: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  templateCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateName: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttonContainer: {
    flex: 1,
  },
});
