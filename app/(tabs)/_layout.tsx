import { AuthContext } from "@/components/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { useContext } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

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
          tabBarLabelStyle: { fontWeight: "bold" },
          title: "Home",
          tabBarLabelPosition: "below-icon",
          tabBarActiveTintColor: "black",
          tabBarIcon: ({ focused, color, size }) => {
            return focused ? (
              <Ionicons name="home" size={26} color="black" />
            ) : (
              <Ionicons name="home-outline" size={26} color="black" />
            );
          },
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarLabelStyle: { fontWeight: "bold" },
          title: "Scanner",
          tabBarLabelPosition: "below-icon",
          tabBarActiveTintColor: "black",
          tabBarIcon: ({ focused, color, size }) => {
            return focused ? (
              <Ionicons name="camera" size={26} color="black" />
            ) : (
              <Ionicons name="camera-outline" size={26} color="black" />
            );
          },
        }}
      />
      <Tabs.Screen
        name="add-meal"
        options={{
          tabBarLabelStyle: { fontWeight: "bold" },
          title: "Add Meal",
          tabBarLabelPosition: "below-icon",
          tabBarActiveTintColor: "black",
          tabBarIcon: ({ focused, color, size }) => {
            return focused ? (
              <Ionicons name="add-circle" size={26} color="black" />
            ) : (
              <Ionicons name="add-circle-outline" size={26} color="black" />
            );
          },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarLabelStyle: { fontWeight: "bold" },
          title: "Account",
          tabBarLabelPosition: "below-icon",
          tabBarActiveTintColor: "black",
          tabBarIcon: ({ focused, color, size }) => {
            return focused ? (
              <Ionicons name="person" size={26} color="black" />
            ) : (
              <Ionicons name="person-outline" size={26} color="black" />
            );
          },
        }}
      />
    </Tabs>
  );
}
