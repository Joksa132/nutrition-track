import { AuthProvider } from "@/components/AuthContext";
import { Stack } from "expo-router";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
        activityLevel TEXT NOT NULL
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
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

export default function RootLayout() {
  const queryClient = new QueryClient();

  return (
    <SQLiteProvider databaseName="nutrition-track.db" onInit={createDbIfNeeded}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </SQLiteProvider>
  );
}
