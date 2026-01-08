import { View, Text, StyleSheet } from "react-native";

export default function BoxesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BoxTrack</Text>
      <Text style={styles.subtitle}>Your Boxes</Text>
      <Text style={styles.description}>
        Track and manage your storage boxes with QR codes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    marginBottom: 16,
    color: "#666",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#999",
  },
});
