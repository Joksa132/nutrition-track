import { AuthContext } from "@/components/AuthContext";
import { useContext, useState } from "react";
import {
  Text,
  View,
  Alert,
  StyleSheet,
  TouchableHighlight,
} from "react-native";
import EditUserInfoModal from "@/components/EditUserInfoModal";

export default function Account() {
  const auth = useContext(AuthContext);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: () => auth?.logout(),
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditInfo = () => {
    if (auth?.user) {
      setModalVisible(true);
    } else {
      Alert.alert("Error", "User not logged in.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {auth?.user?.username}!</Text>
        <Text style={styles.subText}>Manage your account settings here.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Username:</Text>
          <Text style={styles.infoValue}>{auth?.user?.username}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Age:</Text>
          <Text style={styles.infoValue}>{auth?.user?.age}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Height:</Text>
          <Text style={styles.infoValue}>{auth?.user?.height} cm</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Weight:</Text>
          <Text style={styles.infoValue}>{auth?.user?.weight} kg</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Activity level:</Text>
          <Text style={styles.infoValue}>
            {auth?.user?.activityLevel} active
          </Text>
        </View>
      </View>

      <TouchableHighlight style={styles.logoutButton} onPress={handleEditInfo}>
        <Text style={styles.logoutButtonText}>Edit personal info</Text>
      </TouchableHighlight>

      <TouchableHighlight style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableHighlight>

      <EditUserInfoModal
        user={auth?.user!}
        setUser={auth?.setUser!}
        visible={isModalVisible}
        setModalVisible={setModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
    marginTop: 5,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  infoContainer: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.7)",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "black",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});
