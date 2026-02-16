import AsyncStorage from "expo-sqlite/kv-store";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, ReactNode, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Crypto from "expo-crypto";
import { UserInfo } from "@/util/types";

type AuthContextType = {
  user: UserInfo | null;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const db = useSQLiteContext();

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          setUser((prevUser) =>
            prevUser?.id === parsedUser.id ? prevUser : parsedUser
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    checkLoggedInUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const user: UserInfo | null = await db.getFirstAsync(
        "SELECT id, username, gender, age, height, weight, activityLevel, goal, password FROM users WHERE username = ?",
        [username]
      );

      if (user) {
        if (hashedPassword === user.password) {
          setUser((prevUser) => (prevUser?.id === user.id ? prevUser : user));
          await AsyncStorage.setItem(
            "user",
            JSON.stringify({
              id: user.id,
              username: user.username,
              gender: user.gender,
              age: user.age,
              height: user.height,
              weight: user.weight,
              activityLevel: user.activityLevel,
              goal: user.goal,
            })
          );
          return true;
        } else {
          Alert.alert("Error", "Incorrect password. Please try again.");
          return false;
        }
      } else {
        Alert.alert(
          "Error",
          "User doesn't exist. Please try again or create an account."
        );
        return false;
      }
    } catch (error) {
      console.log("Login failed:", error);
      Alert.alert("Error", "An error occurred during login.");
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
