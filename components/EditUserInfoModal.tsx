import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  Alert,
  Modal,
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
import { updateUserInfo } from "@/util/queries";
import { UserUpdateSchema, UserUpdateSchemaType } from "@/util/validations";

type UserInfoModalProps = {
  user: UserInfo;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  visible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ExportUserInfoModal({
  user,
  setUser,
  visible,
  setModalVisible,
}: UserInfoModalProps) {
  const db = useSQLiteContext();
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

  useEffect(() => {
    if (visible && user) {
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
    }
  }, [visible, user]);

  const handleUpdate = async (validatedData: UserUpdateSchemaType) => {
    try {
      let hashedPassword = "";
      if (validatedData.password) {
        hashedPassword = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          validatedData.password
        );
      }

      await updateUserInfo(userInfo, hashedPassword, db);
    } catch (error) {
      throw error;
    }
  };

  const { mutate: updateUser } = useMutation({
    mutationFn: async () => {
      const validatedData = UserUpdateSchema.safeParse(userInfo);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message
        );
        throw new Error(errorMessages.join("\n"));
      }

      await handleUpdate(validatedData.data);
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
        })
      );
      Alert.alert("Success", "User info changed successfully!");
      setModalVisible(false);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error.message || "An error occurred during user info change"
      );
    },
  });

  const handleSave = () => {
    updateUser();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Edit Personal Info</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={userInfo.username}
          onChangeText={(value) =>
            setUserInfo((prev) => ({ ...prev, username: value }))
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={userInfo.password}
          onChangeText={(value) =>
            setUserInfo((prev) => ({ ...prev, password: value }))
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={userInfo.confirmPassword}
          onChangeText={(value) =>
            setUserInfo((prev) => ({ ...prev, confirmPassword: value }))
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={userInfo.age}
          onChangeText={(value) =>
            setUserInfo((prev) => ({ ...prev, age: value }))
          }
          inputMode="decimal"
        />
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          value={userInfo.height}
          onChangeText={(value) =>
            setUserInfo((prev) => ({ ...prev, height: value }))
          }
          inputMode="decimal"
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={userInfo.weight}
          onChangeText={(value) =>
            setUserInfo((prev) => ({ ...prev, weight: value }))
          }
          inputMode="decimal"
        />
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
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.activityLevel}
            onValueChange={(value) =>
              setUserInfo((prev) => ({ ...prev, activityLevel: value }))
            }
          >
            <Picker.Item
              label="Sedentary (little to no activity)"
              value="sedentary"
            />
            <Picker.Item
              label="Lightly Active (exercise 1-3 days a week)"
              value="lightly"
            />
            <Picker.Item
              label="Moderately Active (exercise 3-5 days a week)"
              value="moderately"
            />
            <Picker.Item
              label="Very Active (exercise 6-7 days a week)"
              value="very"
            />
          </Picker>
        </View>
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
        <View style={styles.buttonContainer}>
          <TouchableHighlight style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.button}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableHighlight>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    width: "80%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 4,
    height: 40,
    width: "80%",
    justifyContent: "center",
  },
});
