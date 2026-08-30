import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import { UserInfo } from "@/util/types";
import { Picker } from "@react-native-picker/picker";
import * as Crypto from "expo-crypto";
import AsyncStorage from "expo-sqlite/kv-store";
import { useMutation } from "@tanstack/react-query";
import { updateUserProfile, updateUserPassword } from "@/util/queries";
import {
  UserProfileUpdateSchema,
  PasswordUpdateSchema,
} from "@/util/validations";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

type UserInfoModalProps = {
  user: UserInfo;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  visible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const ACTIVITY_LEVELS = [
  { label: "Sedentary (little to no activity)", value: "sedentary" },
  { label: "Lightly Active (1-3 days/week)", value: "lightly" },
  { label: "Moderately Active (3-5 days/week)", value: "moderately" },
  { label: "Very Active (6-7 days/week)", value: "very" },
];

const GOALS = [
  { label: "Weight loss", value: "weight loss" },
  { label: "Weight gain", value: "weight gain" },
  { label: "Maintenance", value: "maintenance" },
];

export default function EditUserInfoModal({
  user,
  setUser,
  visible,
  setModalVisible,
}: UserInfoModalProps) {
  const db = useSQLiteContext();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: user?.id,
    username: user?.username,
    password: "",
    confirmPassword: "",
    gender: user.gender,
    age: user.age,
    height: user.height,
    weight: user.weight,
    activityLevel: user.activityLevel,
    goal: user.goal,
  });
  const [passwordFields, setPasswordFields] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (visible && user) {
      setActiveTab("profile");
      setUserInfo({
        id: user.id,
        username: user.username,
        password: "",
        confirmPassword: "",
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        goal: user.goal,
      });
      setPasswordFields({ password: "", confirmPassword: "" });
    }
  }, [visible, user]);

  const { mutate: saveProfile } = useMutation({
    mutationFn: async () => {
      const validatedData = UserProfileUpdateSchema.safeParse(userInfo);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message,
        );
        throw new Error(errorMessages.join("\n"));
      }

      await updateUserProfile(userInfo, db);
    },
    onSuccess: async () => {
      setUser(userInfo);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          id: userInfo.id,
          username: userInfo.username,
          gender: userInfo.gender,
          age: userInfo.age,
          height: userInfo.height,
          weight: userInfo.weight,
          activityLevel: userInfo.activityLevel,
          goal: userInfo.goal,
        }),
      );
      Alert.alert("Success", "Profile updated successfully!");
      setModalVisible(false);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error.message || "An error occurred while updating profile",
      );
    },
  });

  const { mutate: savePassword } = useMutation({
    mutationFn: async () => {
      const validatedData = PasswordUpdateSchema.safeParse(passwordFields);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message,
        );
        throw new Error(errorMessages.join("\n"));
      }

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        validatedData.data.password,
      );

      await updateUserPassword(userInfo.id, hashedPassword, db);
    },
    onSuccess: () => {
      Alert.alert("Success", "Password changed successfully!");
      setPasswordFields({ password: "", confirmPassword: "" });
      setModalVisible(false);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error.message || "An error occurred while changing password",
      );
    },
  });

  const handleSave = () => {
    if (activeTab === "profile") {
      saveProfile();
    } else {
      savePassword();
    }
  };

  if (!visible) return null;

  const renderPicker = (
    selectedValue: string,
    onValueChange: (v: string) => void,
    items: { label: string; value: string }[],
  ) => (
    <View style={commonStyles.pickerWrap}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={commonStyles.picker}
        dropdownIconColor={colors.textMuted}
      >
        {items.map(({ label, value }) => (
          <Picker.Item
            key={value}
            label={label}
            value={value}
            color={colors.text}
            style={{ backgroundColor: colors.surfaceAlt }}
          />
        ))}
      </Picker>
    </View>
  );

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={visible}
      onRequestClose={() => setModalVisible(false)}
      hardwareAccelerated
    >
      <View style={commonStyles.modalOverlay}>
        <View style={commonStyles.modalCard}>
          <Text style={commonStyles.modalTitle}>Edit Info</Text>

          <View style={styles.tabRow}>
            <TouchableHighlight
              style={[
                styles.tab,
                activeTab === "profile" ? styles.tabActive : styles.tabInactive,
              ]}
              underlayColor={
                activeTab === "profile" ? colors.accentPress : colors.surfaceAlt
              }
              onPress={() => setActiveTab("profile")}
            >
              <Text
                style={
                  activeTab === "profile"
                    ? styles.tabTextActive
                    : styles.tabTextInactive
                }
              >
                Personal
              </Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={[
                styles.tab,
                activeTab === "password"
                  ? styles.tabActive
                  : styles.tabInactive,
              ]}
              underlayColor={
                activeTab === "password"
                  ? colors.accentPress
                  : colors.surfaceAlt
              }
              onPress={() => setActiveTab("password")}
            >
              <Text
                style={
                  activeTab === "password"
                    ? styles.tabTextActive
                    : styles.tabTextInactive
                }
              >
                Password
              </Text>
            </TouchableHighlight>
          </View>

          <ScrollView
            style={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "profile" ? (
              <>
                <Text style={commonStyles.fieldLabel}>Username</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Username"
                  placeholderTextColor={colors.textFaint}
                  value={userInfo.username}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, username: value }))
                  }
                />

                <Text style={commonStyles.fieldLabel}>Age</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Age"
                  placeholderTextColor={colors.textFaint}
                  value={userInfo.age}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, age: value }))
                  }
                  inputMode="decimal"
                />

                <Text style={commonStyles.fieldLabel}>Height (cm)</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Height (cm)"
                  placeholderTextColor={colors.textFaint}
                  value={userInfo.height}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, height: value }))
                  }
                  inputMode="decimal"
                />

                <Text style={commonStyles.fieldLabel}>Weight (kg)</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Weight (kg)"
                  placeholderTextColor={colors.textFaint}
                  value={userInfo.weight}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, weight: value }))
                  }
                  inputMode="decimal"
                />

                <Text style={commonStyles.fieldLabel}>Gender</Text>
                {renderPicker(
                  userInfo.gender,
                  (value) =>
                    setUserInfo((prev) => ({ ...prev, gender: value })),
                  GENDERS,
                )}

                <Text style={commonStyles.fieldLabel}>Activity Level</Text>
                {renderPicker(
                  userInfo.activityLevel,
                  (value) =>
                    setUserInfo((prev) => ({ ...prev, activityLevel: value })),
                  ACTIVITY_LEVELS,
                )}

                <Text style={commonStyles.fieldLabel}>Goal</Text>
                {renderPicker(
                  userInfo.goal,
                  (value) => setUserInfo((prev) => ({ ...prev, goal: value })),
                  GOALS,
                )}
              </>
            ) : (
              <>
                <Text style={commonStyles.fieldLabel}>New Password</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="New Password"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  value={passwordFields.password}
                  onChangeText={(value) =>
                    setPasswordFields((prev) => ({
                      ...prev,
                      password: value,
                    }))
                  }
                />

                <Text style={commonStyles.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  value={passwordFields.confirmPassword}
                  onChangeText={(value) =>
                    setPasswordFields((prev) => ({
                      ...prev,
                      confirmPassword: value,
                    }))
                  }
                />

                <Text style={styles.passwordHint}>
                  Must be 3-25 characters with at least one lowercase letter,
                  one uppercase letter, and one number.
                </Text>
              </>
            )}
          </ScrollView>

          <View style={commonStyles.modalButtonRow}>
            <TouchableHighlight
              style={[commonStyles.btnGhost, styles.flexBtn]}
              underlayColor={colors.surfaceAlt}
              onPress={() => setModalVisible(false)}
            >
              <Text style={commonStyles.btnGhostText}>Cancel</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={[commonStyles.btnPrimary, styles.flexBtn]}
              underlayColor={colors.accentPress}
              onPress={handleSave}
            >
              <Text style={commonStyles.btnPrimaryText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: space.sm,
    marginBottom: space.lg,
  },
  tab: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabInactive: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabTextActive: {
    ...type.button,
    fontSize: 13,
    color: "#FFFFFF",
  },
  tabTextInactive: {
    ...type.button,
    fontSize: 13,
    color: colors.textMuted,
  },
  formScroll: {
    flexGrow: 0,
  },
  passwordHint: {
    ...type.caption,
    color: colors.textFaint,
    marginBottom: space.md,
  },
  flexBtn: {
    flex: 1,
  },
});
