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

type UserInfoModalProps = {
  user: UserInfo;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  visible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

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

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.dimOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Info</Text>

          <View style={styles.tabRow}>
            <TouchableHighlight
              style={[
                styles.tab,
                activeTab === "profile" ? styles.tabActive : styles.tabInactive,
              ]}
              underlayColor={activeTab === "profile" ? "#333" : "#f0f0f0"}
              onPress={() => setActiveTab("profile")}
            >
              <Text
                style={
                  activeTab === "profile"
                    ? styles.tabTextActive
                    : styles.tabTextInactive
                }
              >
                Personal Info
              </Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={[
                styles.tab,
                activeTab === "password"
                  ? styles.tabActive
                  : styles.tabInactive,
              ]}
              underlayColor={activeTab === "password" ? "#333" : "#f0f0f0"}
              onPress={() => setActiveTab("password")}
            >
              <Text
                style={
                  activeTab === "password"
                    ? styles.tabTextActive
                    : styles.tabTextInactive
                }
              >
                Change Password
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
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={userInfo.username}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, username: value }))
                  }
                />

                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={userInfo.age}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, age: value }))
                  }
                  inputMode="decimal"
                />

                <Text style={styles.fieldLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Height (cm)"
                  value={userInfo.height}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, height: value }))
                  }
                  inputMode="decimal"
                />

                <Text style={styles.fieldLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Weight (kg)"
                  value={userInfo.weight}
                  onChangeText={(value) =>
                    setUserInfo((prev) => ({ ...prev, weight: value }))
                  }
                  inputMode="decimal"
                />

                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={userInfo.gender}
                    onValueChange={(value) =>
                      setUserInfo((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                  </Picker>
                </View>

                <Text style={styles.fieldLabel}>Activity Level</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={userInfo.activityLevel}
                    onValueChange={(value) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        activityLevel: value,
                      }))
                    }
                  >
                    <Picker.Item
                      label="Sedentary (little to no activity)"
                      value="sedentary"
                    />
                    <Picker.Item
                      label="Lightly Active (1-3 days/week)"
                      value="lightly"
                    />
                    <Picker.Item
                      label="Moderately Active (3-5 days/week)"
                      value="moderately"
                    />
                    <Picker.Item
                      label="Very Active (6-7 days/week)"
                      value="very"
                    />
                  </Picker>
                </View>

                <Text style={styles.fieldLabel}>Goal</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={userInfo.goal}
                    onValueChange={(value) =>
                      setUserInfo((prev) => ({ ...prev, goal: value }))
                    }
                  >
                    <Picker.Item label="Weight loss" value="weight loss" />
                    <Picker.Item label="Weight gain" value="weight gain" />
                    <Picker.Item label="Maintenance" value="maintenance" />
                  </Picker>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  secureTextEntry
                  value={passwordFields.password}
                  onChangeText={(value) =>
                    setPasswordFields((prev) => ({
                      ...prev,
                      password: value,
                    }))
                  }
                />

                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
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

          <View style={styles.buttonRow}>
            <TouchableHighlight
              style={styles.outlineButton}
              underlayColor="#f0f0f0"
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.primaryButton}
              underlayColor="#333"
              onPress={handleSave}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "black",
  },
  tabInactive: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "black",
  },
  tabTextActive: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  tabTextInactive: {
    color: "black",
    fontWeight: "bold",
    fontSize: 13,
  },
  formScroll: {
    flexGrow: 0,
  },
  fieldLabel: {
    fontSize: 13,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
  },
  passwordHint: {
    fontSize: 12,
    color: "rgba(0,0,0,0.4)",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
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
});
