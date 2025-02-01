import { AuthContext } from "@/components/AuthContext";
import { Redirect, Stack, Tabs } from "expo-router";
import { useContext } from "react";

export default function AuthLayout() {
  const auth = useContext(AuthContext);

  if (auth?.isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
