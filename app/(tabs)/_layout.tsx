import { AuthContext } from "@/components/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { useContext } from "react";

export default function TabLayout() {
  const auth = useContext(AuthContext);

  if (!auth?.isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Barcode Scanner",
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add food",
        }}
      />
    </Tabs>
  );
}
