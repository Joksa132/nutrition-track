import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type LoadingProps = {
  message?: string;
};

export default function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="black" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
