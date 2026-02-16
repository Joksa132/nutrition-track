import { AuthProvider } from "@/components/AuthContext";
import { Stack } from "expo-router";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "expo-sqlite/kv-store";

const createDbIfNeeded = async (db: SQLiteDatabase) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL, 
        username TEXT UNIQUE NOT NULL, 
        password TEXT NOT NULL,
        gender TEXT NOT NULL,
        age TEXT NOT NULL,
        height TEXT NOT NULL,
        weight TEXT NOT NULL,
        activityLevel TEXT NOT NULL,
        goal TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS nutrition_info (
        id TEXT PRIMARY KEY NOT NULL,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        mealType TEXT NOT NULL,
        foodName TEXT NOT NULL,
        quantity REAL NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL, 
        carbohydrates REAL NOT NULL,
        sugar REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS product_info (
        id TEXT PRIMARY KEY NOT NULL,
        product_name TEXT NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL, 
        carbohydrates REAL NOT NULL,
        sugar REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL,
        barcode TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS product_templates (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        calories REAL NOT NULL,
        fat REAL NOT NULL, 
        carbohydrates REAL NOT NULL,
        sugar REAL NOT NULL,
        protein REAL NOT NULL,
        fiber REAL NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

const APP_VERSION_KEY = "app_version";
const DB_NAME = "nutrition-track.db";

const backupDbIfVersionChanged = async () => {
  try {
    const currentVersion = Constants.expoConfig?.version || "unknown";
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);

    if (storedVersion && storedVersion !== currentVersion) {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const backupPath = `${backupDir}nutrition-track-v${storedVersion}.db`;

      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      }

      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      if (dbInfo.exists) {
        await FileSystem.copyAsync({ from: dbPath, to: backupPath });
        console.log(`DB backed up: ${backupPath}`);
      }
    }

    await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
  } catch (error) {
    console.error("DB backup failed:", error);
  }
};

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    backupDbIfVersionChanged();
  }, []);

  return (
    <SQLiteProvider databaseName="nutrition-track.db" onInit={createDbIfNeeded}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <AuthProvider>
            <StatusBar barStyle={"dark-content"} />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}
