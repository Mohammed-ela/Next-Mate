import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const handleSignOut = () => {
    // Simulation de déconnexion
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur NextMate ! 🎮</Text>
      
      <Text style={styles.subtitle}>
        Vous êtes connecté !
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        🚧 Version de test - Firebase à ajouter !
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#666",
  },
  button: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    minWidth: 200,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  note: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 30,
    fontStyle: "italic",
  },
});
