import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ImpactScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Impact Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
  },
});

