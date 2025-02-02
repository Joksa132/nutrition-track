import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Alert,
  TextInput,
  TouchableHighlight,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import * as Crypto from "expo-crypto";

export default function Register() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const router = useRouter();
  const db = useSQLiteContext();

  const handleRegister = async () => {
    try {
      const userId = uuidv4();

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match. Please try again.", [
          {
            text: "Ok",
          },
        ]);
        return;
      }

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      await db.runAsync(
        "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
        [userId, username, hashedPassword]
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
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableHighlight
        style={styles.registerButton}
        onPress={handleRegister}
      >
        <Text style={styles.registerButtonText}>Login</Text>
      </TouchableHighlight>
      <Link href="/login" asChild>
        <Text style={styles.link}>Already have an account? Login here.</Text>
      </Link>
    </View>
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
});
