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
  updateTemplate,
} from "@/util/queries";
import { useSQLiteContext } from "expo-sqlite";
import { ProductTemplate } from "@/util/types";
import * as Crypto from "expo-crypto";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import SaveModal from "@/components/SaveModal";
import TemplateFormModal from "@/components/TemplateFormModal";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

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
  const [editTemplateModalVisible, setEditTemplateModalVisible] =
    useState<boolean>(false);
  const [templateToEdit, setTemplateToEdit] = useState<ProductTemplate | null>(
    null,
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

  const { mutate: updateTemplateMutation } = useMutation({
    mutationFn: (vars: {
      id: string;
      productName: string;
      calories: number;
      fat: number;
      carbohydrates: number;
      sugar: number;
      protein: number;
      fiber: number;
    }) =>
      updateTemplate(
        vars.id,
        vars.productName,
        vars.calories,
        vars.fat,
        vars.carbohydrates,
        vars.sugar,
        vars.protein,
        vars.fiber,
        db,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templateInfo"] });
      setEditTemplateModalVisible(false);
      Alert.alert("Success", "Template updated.");
    },
    onError: (error: Error) => {
      console.error("Error updating template:", error);
      Alert.alert("Error", "Failed to update template.");
    },
  });

  const handleEditTemplate = (template: ProductTemplate) => {
    setTemplateToEdit(template);
    setEditTemplateModalVisible(true);
  };

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
      onChange: (_e, selectedDateValue) => {
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
    <View style={commonStyles.screen}>
      <ScrollView
        contentContainerStyle={commonStyles.scrollContent}
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
            style={[commonStyles.btnPrimary, styles.flexBtn]}
            underlayColor={colors.accentPress}
            onPress={handleEditInfo}
          >
            <Text style={commonStyles.btnPrimaryText}>Edit Info</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={[commonStyles.btnGhost, styles.flexBtn]}
            underlayColor={colors.surfaceAlt}
            onPress={handleLogout}
          >
            <Text style={commonStyles.btnGhostText}>Logout</Text>
          </TouchableHighlight>
        </View>

        <Pressable
          style={styles.utilityButton}
          onPress={handleCheckForUpdates}
          disabled={isCheckingUpdates}
          android_ripple={{ color: colors.surfaceAlt }}
        >
          <Ionicons
            name="cloud-download-outline"
            size={15}
            color={colors.textFaint}
          />
          <Text style={styles.utilityButtonText}>
            {isCheckingUpdates ? "Checking..." : "Check for Updates"}
          </Text>
        </Pressable>

        <Text style={commonStyles.sectionTitle}>
          Product Templates{" "}
          <Text style={styles.countBadge}>{templates.length}</Text>
        </Text>

        {isLoading ? (
          <Text style={commonStyles.emptyText}>Loading templates...</Text>
        ) : isError ? (
          <Text style={commonStyles.errorText}>
            Error loading templates: {error.message}
          </Text>
        ) : templates.length === 0 ? (
          <Text style={commonStyles.emptyText}>No product templates saved.</Text>
        ) : (
          templates.map((template, index) => {
            const isExpanded = expandedTemplates.has(template.id);
            const isFirst = index === 0;
            const isLast = index === templates.length - 1;
            return (
              <View key={template.id} style={commonStyles.card}>
                <View style={styles.templateCardHeader}>
                  <View style={styles.reorderColumn}>
                    <Pressable
                      onPress={() => moveTemplate(index, -1)}
                      disabled={isFirst}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
                        color={isFirst ? colors.border : colors.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveTemplate(index, 1)}
                      disabled={isLast}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={isLast ? colors.border : colors.textMuted}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.templateHeaderTapArea}
                    onPress={() => toggleTemplate(template.id)}
                    android_ripple={{ color: colors.surfaceAlt }}
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
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.textFaint}
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
                          {template.calories}
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Fat</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.fat}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Carbs</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.carbohydrates}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Sugar</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.sugar}g
                        </Text>
                      </View>
                      <View style={commonStyles.macroCell}>
                        <Text style={commonStyles.macroCellLabel}>Protein</Text>
                        <Text style={commonStyles.macroCellValue}>
                          {template.protein}g
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
                        style={[commonStyles.btnPrimary, styles.actionBtn]}
                        underlayColor={colors.accentPress}
                        onPress={() => {
                          setSelectedTemplate(template);
                          setTemplateModalVisible(true);
                        }}
                      >
                        <Text style={commonStyles.btnPrimaryText}>
                          Save meal
                        </Text>
                      </TouchableHighlight>
                      <TouchableHighlight
                        style={[commonStyles.btnGhost, styles.actionBtn]}
                        underlayColor={colors.surfaceAlt}
                        onPress={() => handleEditTemplate(template)}
                      >
                        <Text style={styles.actionGhostText}>Edit</Text>
                      </TouchableHighlight>
                      <TouchableHighlight
                        style={[commonStyles.btnGhost, styles.actionBtn]}
                        underlayColor={colors.surfaceAlt}
                        onPress={() => handleDeleteTemplate(template.id)}
                      >
                        <Text style={styles.actionGhostText}>Delete</Text>
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

      {templateToEdit && (
        <TemplateFormModal
          visible={editTemplateModalVisible}
          setVisible={setEditTemplateModalVisible}
          title="Edit Template"
          initial={{
            productName: templateToEdit.product_name,
            calories: String(templateToEdit.calories),
            fat: String(templateToEdit.fat),
            carbohydrates: String(templateToEdit.carbohydrates),
            sugar: String(templateToEdit.sugar),
            protein: String(templateToEdit.protein),
            fiber: String(templateToEdit.fiber),
          }}
          onSubmit={(values) =>
            updateTemplateMutation({ id: templateToEdit.id, ...values })
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
  },
  profileUsername: {
    ...type.display,
    marginBottom: space.sm,
  },
  goalBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    marginBottom: space.sm,
  },
  goalBadgeText: {
    ...type.label,
    fontSize: 10,
    color: colors.accent,
  },
  profileStatsLine: {
    ...type.caption,
  },
  buttonRow: {
    flexDirection: "row",
    gap: space.sm,
    marginBottom: space.sm,
  },
  flexBtn: {
    flex: 1,
  },
  utilityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    marginBottom: space.xl,
  },
  utilityButtonText: {
    ...type.label,
  },
  countBadge: {
    ...type.h2,
    color: colors.textFaint,
  },
  templateCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  reorderColumn: {
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  templateHeaderTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  templateName: {
    ...type.h2,
    flex: 1,
    fontSize: 16,
  },
  templateChips: {
    flexDirection: "row",
    gap: space.xs,
  },
  calorieChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  calorieChipText: {
    fontFamily: type.num.fontFamily,
    fontSize: 12,
    color: colors.accent,
  },
  proteinChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  proteinChipText: {
    fontFamily: type.num.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
  templateExpanded: {
    marginTop: space.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.sm,
  },
  templateActions: {
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: space.sm,
  },
  actionGhostText: {
    ...type.button,
    fontSize: 13,
    color: colors.textMuted,
  },
});
