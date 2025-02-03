import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

async function handleShareDB() {
  try {
    const dbFilePath = `${FileSystem.documentDirectory}SQLite/nutrition-track-db`; // Adjust the path if necessary
    const fileInfo = await FileSystem.getInfoAsync(dbFilePath);

    if (fileInfo.exists) {
      await Sharing.shareAsync(dbFilePath, {
        dialogTitle: "Share your database file",
      });
    } else {
      Alert.alert("Error", "Database file does not exist.");
    }
  } catch (error) {
    console.log("Error sharing database:", error);
    Alert.alert("Error", "Failed to share the database file.");
  }
}
