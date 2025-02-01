import { AuthContext } from "@/components/AuthContext";
import { Link, useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Text, View, StyleSheet, Button, TextInput, Alert } from "react-native";

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
      <Button title="Login" onPress={handleLogin} />
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
  link: {
    marginTop: 16,
    color: "blue",
    textAlign: "center",
  },
});
