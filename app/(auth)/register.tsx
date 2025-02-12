import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Alert,
  TextInput,
  TouchableHighlight,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import "react-native-get-random-values";
import * as Crypto from "expo-crypto";
import { Picker } from "@react-native-picker/picker";
import { UserRegister } from "@/util/types";

export default function Register() {
  const [userInfo, setUserInfo] = useState<UserRegister>({
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
  });
  const router = useRouter();
  const db = useSQLiteContext();

  const handleRegister = async () => {
    try {
      const userId = Crypto.randomUUID();

      if (userInfo.password !== userInfo.confirmPassword) {
        Alert.alert("Error", "Passwords do not match. Please try again.", [
          {
            text: "Ok",
          },
        ]);
        return;
      }

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        userInfo.password
      );

      await db.runAsync(
        "INSERT INTO users (id, username, password, gender, age, height, weight, activityLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          userInfo.username,
          hashedPassword,
          userInfo.gender,
          userInfo.age,
          userInfo.height,
          userInfo.weight,
          userInfo.activityLevel,
        ]
      );
      Alert.alert("Success", "Registration successful! Please login.");
      router.push("/(auth)/login");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "An error occurred during registration", [
        {
          text: "Ok",
        },
      ]);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
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
        <TouchableHighlight
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableHighlight>
        <Link href="/login" asChild>
          <Text style={styles.link}>Already have an account? Login here.</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 30,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    height: 40,
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  registerButton: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  registerButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  link: {
    marginTop: 16,
    color: "rgba(0, 0, 0, 0.8)",
    textAlign: "center",
  },
  pickerContainer: {
    borderColor: "rgb(204, 204, 204)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 4,
    height: 40,
    justifyContent: "center",
  },
});
