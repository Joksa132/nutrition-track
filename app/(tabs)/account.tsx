import { AuthContext } from "@/components/AuthContext";
import { useContext, useState } from "react";
import {
  Text,
  View,
  Alert,
  StyleSheet,
  TouchableHighlight,
  Pressable,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Updates from "expo-updates";
import EditUserInfoModal from "@/components/EditUserInfoModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMealToDb,
  deleteTemplate,
  getAllTemplates,
  reorderTemplates,
} from "@/util/queries";
import { useSQLiteContext } from "expo-sqlite";
import { ProductTemplate } from "@/util/types";
import * as Crypto from "expo-crypto";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import SaveModal from "@/components/SaveModal";
import { commonStyles } from "@/styles/common";

export default function Account() {
  const auth = useContext(AuthContext);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [templateModalVisible, setTemplateModalVisible] =
    useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState<string>("");
  const [mealType, setMealType] = useState<string>("breakfast");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProductTemplate | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(
    new Set(),
  );
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);

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

  const { mutate: reorderTemplatesMutation } = useMutation({
    mutationFn: (orderedIds: string[]) => reorderTemplates(orderedIds, db),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
    },
    onError: (error: Error) => {
      console.error("Error reordering templates:", error);
    },
  });

  const moveTemplate = (index: number, direction: -1 | 1) => {
    if (!productTemplates) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= productTemplates.length) return;
    const reordered = [...productTemplates];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    reorderTemplatesMutation(reordered.map((t) => t.id));
  };

  const toggleTemplate = (id: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      { cancelable: true },
    );
  };

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
          [{ text: "Restart", onPress: () => Updates.reloadAsync() }],
        );
      } else {
        Alert.alert("Up to Date", "You are running the latest version.");
      }
    } catch (error) {
      Alert.alert(
        "Update Check Failed",
        "Could not check for updates. Make sure you are using a production build.",
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
          },
        },
      ],
      { cancelable: true },
    );
  };

  const showDatepicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(selectedDate),
      onChange: (e, selectedDateValue) => {
        if (!selectedDateValue) return;
        const convertedDate = selectedDateValue.toISOString().split("T")[0];
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
        db,
      );
      Alert.alert(
        "Success",
        `Added ${selectedTemplate.product_name} to today's meal list.`,
      );
      setTemplateModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["foodInfo"] });
    } catch (error) {
      console.error("Error adding meal to database:", error);
      Alert.alert(
        "Error",
        `Failed to add ${selectedTemplate.product_name} to today's meal list.`,
      );
    }
  };

  const formatGoal = (goal: string | undefined) => {
    if (!goal) return "";
    return goal.charAt(0).toUpperCase() + goal.slice(1);
  };

  const templates = productTemplates ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileBanner}>
          <Text style={styles.profileUsername}>{auth?.user?.username}</Text>
          {auth?.user?.goal && (
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                {formatGoal(auth.user.goal)}
              </Text>
            </View>
          )}
          <Text style={styles.profileStatsLine}>
            Age {auth?.user?.age} · {auth?.user?.height}cm ·{" "}
            {auth?.user?.weight}kg · {auth?.user?.activityLevel} active
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableHighlight
            style={styles.primaryButton}
            underlayColor="#333"
            onPress={handleEditInfo}
          >
            <Text style={styles.primaryButtonText}>Edit Info</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.outlineButton}
            underlayColor="#f0f0f0"
            onPress={handleLogout}
          >
            <Text style={styles.outlineButtonText}>Logout</Text>
          </TouchableHighlight>
        </View>

        <TouchableHighlight
          style={styles.utilityButton}
          underlayColor="#e0e0e0"
          onPress={handleCheckForUpdates}
          disabled={isCheckingUpdates}
        >
          <Text style={styles.utilityButtonText}>
            {isCheckingUpdates ? "Checking..." : "Check for Updates"}
          </Text>
        </TouchableHighlight>

        <Text style={styles.sectionTitle}>Product Templates</Text>

        {isLoading ? (
          <Text style={styles.emptyText}>Loading product templates...</Text>
        ) : isError ? (
          <Text style={styles.emptyText}>
            Error loading product templates: {error.message}
          </Text>
        ) : templates.length === 0 ? (
          <Text style={styles.emptyText}>No product templates saved.</Text>
        ) : (
          templates.map((template, index) => {
            const isExpanded = expandedTemplates.has(template.id);
            const isFirst = index === 0;
            const isLast = index === templates.length - 1;
            return (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateCardHeader}>
                  <View style={styles.reorderColumn}>
                    <Pressable
                      onPress={() => moveTemplate(index, -1)}
                      disabled={isFirst}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
                        color={isFirst ? "#ccc" : "#555"}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveTemplate(index, 1)}
                      disabled={isLast}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={isLast ? "#ccc" : "#555"}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.templateHeaderTapArea}
                    onPress={() => toggleTemplate(template.id)}
                    android_ripple={{ color: "#e8e8e8" }}
                  >
                    <Text style={styles.templateName} numberOfLines={1}>
                      {template.product_name}
                    </Text>
                    <View style={styles.templateChips}>
                      <View style={styles.calorieChip}>
                        <Text style={styles.calorieChipText}>
                          {template.calories} kcal
                        </Text>
                      </View>
                      <View style={styles.proteinChip}>
                        <Text style={styles.proteinChipText}>
                          {template.protein}g P
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={
                        isExpanded
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={18}
                      color="rgba(0,0,0,0.4)"
                    />
                  </Pressable>
                </View>

                {isExpanded && (
                  <View style={styles.templateExpanded}>
                    <View style={styles.separator} />
                    <View style={commonStyles.macroGrid}>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Calories</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.calories} kcal
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Protein</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.protein}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.carbohydrates}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Fat</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.fat}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.sugar}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Fiber</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.fiber}g
                        </Text>
                      </View>
                    </View>
                    <View style={styles.templateActions}>
                      <TouchableHighlight
                        style={styles.saveMealButton}
                        underlayColor="#333"
                        onPress={() => {
                          setSelectedTemplate(template);
                          setTemplateModalVisible(true);
                        }}
                      >
                        <Text style={styles.saveMealButtonText}>Save meal</Text>
                      </TouchableHighlight>
                      <TouchableHighlight
                        style={styles.deleteTemplateButton}
                        underlayColor="#f0f0f0"
                        onPress={() => handleDeleteTemplate(template.id)}
                      >
                        <Text style={styles.deleteTemplateButtonText}>
                          Delete
                        </Text>
                      </TouchableHighlight>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  profileBanner: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileUsername: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  goalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  goalBadgeText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
    fontWeight: "500",
  },
  profileStatsLine: {
    fontSize: 13,
    color: "rgba(0,0,0,0.6)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "black",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  outlineButton: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "black",
    padding: 12,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 15,
  },
  utilityButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  utilityButtonText: {
    color: "black",
    fontWeight: "500",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.5)",
  },
  templateCard: commonStyles.card,
  templateCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reorderColumn: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
    gap: 2,
  },
  templateHeaderTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  templateName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "black",
  },
  templateChips: {
    flexDirection: "row",
    gap: 6,
  },
  calorieChip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calorieChipText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  proteinChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  proteinChipText: {
    color: "black",
    fontSize: 12,
    fontWeight: "600",
  },
  templateExpanded: {
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#e8e8e8",
    marginVertical: 8,
  },
  templateActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  saveMealButton: {
    flex: 1,
    backgroundColor: "black",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  saveMealButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteTemplateButton: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "black",
    padding: 10,
    alignItems: "center",
  },
  deleteTemplateButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 14,
  },
});
