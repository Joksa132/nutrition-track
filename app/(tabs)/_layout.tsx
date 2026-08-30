import { AuthContext } from "@/components/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { useContext } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";
import { colors, font } from "@/styles/theme";

type TabDef = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { name: "index", title: "Home", icon: "home", iconOutline: "home-outline" },
  {
    name: "scanner",
    title: "Scanner",
    icon: "camera",
    iconOutline: "camera-outline",
  },
  {
    name: "search",
    title: "Search",
    icon: "search-circle",
    iconOutline: "search-circle-outline",
  },
  {
    name: "add",
    title: "Add",
    icon: "add-circle",
    iconOutline: "add-circle-outline",
  },
  {
    name: "account",
    title: "Account",
    icon: "person",
    iconOutline: "person-outline",
  },
];

export default function TabLayout() {
  const auth = useContext(AuthContext);

  if (!auth?.isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontFamily: font.condensed,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
        tabBarLabelPosition: "below-icon",
      }}
    >
      {TABS.map(({ name, title, icon, iconOutline }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? icon : iconOutline}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
