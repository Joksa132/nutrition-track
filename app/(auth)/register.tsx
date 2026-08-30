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
import { UserRegisterSchema } from "@/util/validations";
import { registerUser } from "@/util/queries";
import { commonStyles } from "@/styles/common";
import { colors, radius, space, type } from "@/styles/theme";

const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const ACTIVITY_LEVELS = [
  { label: "Sedentary (little to no activity)", value: "sedentary" },
  { label: "Lightly Active (exercise 1-3 days a week)", value: "lightly" },
  { label: "Moderately Active (exercise 3-5 days a week)", value: "moderately" },
  { label: "Very Active (exercise 6-7 days a week)", value: "very" },
];

const GOALS = [
  { label: "Weight loss", value: "weight loss" },
  { label: "Weight gain", value: "weight gain" },
  { label: "Maintenance", value: "maintenance" },
];

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

export default function Register() {
  const [userInfo, setUserInfo] = useState<UserRegister>({
    username: "",
    password: "",
    confirmPassword: "",
    gender: "male",
    age: "",
    height: "",
    weight: "",
    activityLevel: "sedentary",
    goal: "weight loss",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const db = useSQLiteContext();

  const handleRegister = async () => {
    try {
      const validatedData = UserRegisterSchema.safeParse(userInfo);

      if (!validatedData.success) {
        const errorMessages = validatedData.error.errors.map(
          (error) => error.message
        );
        Alert.alert("Validation error", errorMessages.join("\n"));
        return;
      }

      setIsLoading(true);
      const userId = Crypto.randomUUID();

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        validatedData.data.password
      );

      await registerUser(
        userId,
        validatedData.data.username,
        hashedPassword,
        validatedData.data.gender,
        validatedData.data.age,
        validatedData.data.height,
        validatedData.data.weight,
        validatedData.data.activityLevel,
        validatedData.data.goal,
        db
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.brand}>CREATE</Text>
        <Text style={styles.brandAccent}>ACCOUNT</Text>
        <Text style={styles.subtitle}>Set up your daily targets</Text>

        <View style={styles.card}>
          <Text style={commonStyles.fieldLabel}>Username</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Username"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            value={userInfo.username}
            onChangeText={(value) =>
              setUserInfo((prev) => ({ ...prev, username: value }))
            }
          />
          <Text style={commonStyles.fieldLabel}>Password</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Password"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            value={userInfo.password}
            onChangeText={(value) =>
              setUserInfo((prev) => ({ ...prev, password: value }))
            }
          />
          <Text style={commonStyles.fieldLabel}>Confirm Password</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            value={userInfo.confirmPassword}
            onChangeText={(value) =>
              setUserInfo((prev) => ({ ...prev, confirmPassword: value }))
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
            (value) => setUserInfo((prev) => ({ ...prev, gender: value })),
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

          <TouchableHighlight
            style={[
              commonStyles.btnPrimary,
              styles.submit,
              isLoading && commonStyles.btnDisabled,
            ]}
            underlayColor={colors.accentPress}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={commonStyles.btnPrimaryText}>
              {isLoading ? "Registering..." : "Register"}
            </Text>
          </TouchableHighlight>
          <Link href="/login" asChild>
            <Text style={styles.link}>Already have an account? Login here.</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: space.lg,
  },
  brand: {
    ...type.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 1,
  },
  brandAccent: {
    ...type.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 1,
    color: colors.accent,
  },
  subtitle: {
    ...type.caption,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
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
