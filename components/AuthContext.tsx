import AsyncStorage from "expo-sqlite/kv-store";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, ReactNode, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Crypto from "expo-crypto";
import { UserInfo } from "@/util/types";

type AuthContextType = {
  user: UserInfo | null;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  login: (username: string, password: string) => Promise<void>;
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

  const login = async (username: string, password: string) => {
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const user: UserInfo | null = await db.getFirstAsync(
        "SELECT id, username, password, gender, age, height, weight, activityLevel FROM users WHERE username = ?",
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
            })
          );
        } else {
          Alert.alert("Error", "Incorrect password. Please try again.", [
            {
              text: "Ok",
            },
          ]);
          throw new Error("Invalid credentials");
        }
      } else {
        Alert.alert(
          "Error",
          "User doesn't exist. Please try again or create an account.",
          [
            {
              text: "Ok",
            },
          ]
        );
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.log("Login failed:", error);
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
