import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSQLiteContext } from "expo-sqlite";
import { createContext, ReactNode, useEffect, useState } from "react";
import { Alert } from "react-native";

type AuthContextType = {
  user: { id: string; username: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );
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
      const user = await db.getFirstAsync<{ id: string; username: string }>(
        "SELECT id, username FROM users WHERE username = ? AND password = ?",
        [username, password]
      );

      if (user) {
        setUser((prevUser) => (prevUser?.id === user.id ? prevUser : user));
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ id: user.id, username: user.username })
        );
      } else {
        Alert.alert(
          "Error",
          "User credentials are not correct. Please try again or create an account.",
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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
