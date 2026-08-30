import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "@/styles/theme";

type LoadingProps = {
  message?: string;
};

export default function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    paddingVertical: space.xl,
  },
  loadingText: {
    ...type.label,
    marginTop: space.md,
  },
});
