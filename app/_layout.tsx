import { AuthProvider } from "@/components/AuthContext";
import { Stack } from "expo-router";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "react-native";

const createDbIfNeeded = async (db: SQLiteDatabase) => {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL, 
      username TEXT UNIQUE NOT NULL, 
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nutrition_info (
      id TEXT PRIMARY KEY NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      calories REAL NOT NULL,
      fat REAL NOT NULL, 
      carbohydrates REAL NOT NULL,
      sugar REAL NOT NULL,
      protein REAL NOT NULL,
      fiber REAL NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    `);
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="nutrition-track-db" onInit={createDbIfNeeded}>
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
    </SQLiteProvider>
  );
}
