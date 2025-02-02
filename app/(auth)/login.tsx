import { AuthContext } from "@/components/AuthContext";
import { Link, useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Alert,
  TouchableHighlight,
} from "react-native";

export default function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();
  const auth = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await auth?.login(username, password);
      router.push("/(tabs)");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "An error occurred during login", [
        {
          text: "Ok",
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
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
      <TouchableHighlight style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableHighlight>
      <Link href="/register" asChild>
        <Text style={styles.link}>Don't have an account? Register here.</Text>
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
  loginButton: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
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
