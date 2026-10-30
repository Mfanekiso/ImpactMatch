import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Same palette as SponsorImpactScreen so the new screens match the app.
// primary is the deep green used for buttons there (buttonDark).
export const COLORS = {
  primary: "#013e37",
  primarySoft: "rgba(1, 62, 55, 0.08)",
  gold: "#D9C982",
  goldSoft: "rgba(217, 201, 130, 0.2)",
  white: "#FFFFFF",
};

// Neutral colours for the payment screens
export const NEUTRAL = {
  text: "#433327",
  muted: "#6F5F52",
  border: "#E8DFD5",
  background: "#F8F6EE",
  track: "#E8DFD5",
  warnBg: "#FDEBD3",
  warnText: "#8A3B00",
  offBg: "#EFEAE3",
};

// tone: "good" | "wait" | "off"
export function StatusBadge({ label, tone = "good" }) {
  const tones = {
    good: { bg: COLORS.primarySoft, fg: COLORS.primary },
    wait: { bg: NEUTRAL.warnBg, fg: NEUTRAL.warnText },
    off: { bg: NEUTRAL.offBg, fg: NEUTRAL.muted },
  };
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ percent }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start" },
  badgeText: { fontFamily: "Manrope_700Bold", fontSize: 12 },
  track: { height: 8, borderRadius: 8, backgroundColor: NEUTRAL.track, overflow: "hidden" },
  fill: { height: 8, backgroundColor: COLORS.primary },
});