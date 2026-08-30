import { AuthContext } from "@/components/AuthContext";
import { UserLoginSchema } from "@/util/validations";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const auth = useContext(AuthContext);

  const handleLogin = async () => {
    const validatedData = UserLoginSchema.safeParse({ username, password });

    if (!validatedData.success) {
      const errorMessages = validatedData.error.errors.map(
        (error) => error.message
      );
      Alert.alert("Validation Error", errorMessages.join("\n"));
      return;
    }

    setIsLoading(true);
    const success = await auth?.login(
      validatedData.data.username,
      validatedData.data.password
    );
    setIsLoading(false);

    if (success) {
      router.push("/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>NUTRITION</Text>
        <Text style={styles.brandAccent}>TRACK</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Text style={commonStyles.fieldLabel}>Username</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Username"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <Text style={commonStyles.fieldLabel}>Password</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Password"
          placeholderTextColor={colors.textFaint}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableHighlight
          style={[
            commonStyles.btnPrimary,
            styles.submit,
            isLoading && commonStyles.btnDisabled,
          ]}
          underlayColor={colors.accentPress}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={commonStyles.btnPrimaryText}>
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </TouchableHighlight>
        <Link href="/register" asChild>
          <Text style={styles.link}>Don't have an account? Register here.</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
  },
  brand: {
    ...type.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: 1,
  },
  brandAccent: {
    ...type.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: 1,
    color: colors.accent,
  },
  subtitle: {
    ...type.caption,
    marginTop: space.xs,
    marginBottom: space.xl,
  },
  submit: {
    marginTop: space.sm,
  },
  link: {
    ...type.caption,
    marginTop: space.lg,
    textAlign: "center",
  },
});
