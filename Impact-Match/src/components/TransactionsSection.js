import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from "@react-native-vector-icons/ionicons";
import useTransactions from "../hooks/useTransactions";
import { COLORS, NEUTRAL } from "./PayUI";

const PAGE_SIZE = 5;

// Default colours. Pass a "palette" to match the screen it is used on.
const DEFAULT_PALETTE = {
  accent: COLORS.primary,
  accentSoft: COLORS.primarySoft,
  border: NEUTRAL.border,
  text: NEUTRAL.text,
  muted: NEUTRAL.muted,
};

const money = (value) => {
  const n = Number(value) || 0;
  const whole = Number.isInteger(n);
  return `R${n.toLocaleString("en-ZA", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();
  if (!date) return "Just now";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};

// role: "sponsor" (payments made) or "ngo" (payments received)
export default function TransactionsSection({ role = "sponsor", palette }) {
  const p = { ...DEFAULT_PALETTE, ...palette };
  const styles = useMemo(() => makeStyles(p), [p.accent, p.accentSoft, p.border, p.text, p.muted]);

  const { transactions, loading, error, unseenKeys, markAllSeen } = useTransactions(role);
  const isFocused = useIsFocused();
  const isNgo = role === "ngo";

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [newKeys, setNewKeys] = useState([]);

  // While the user looks at this screen: remember which ones are new, then clear the tab badge.
  // When they leave, the "New" tags go away.
  useEffect(() => {
    if (!isFocused) {
      setNewKeys((prev) => (prev.length ? [] : prev));
      return;
    }
    if (unseenKeys.length > 0) {
      setNewKeys((prev) => [...new Set([...prev, ...unseenKeys])]);
      markAllSeen();
    }
  }, [isFocused, unseenKeys, markAllSeen]);

  // Summary numbers
  const total = transactions.reduce((sum, t) => sum + (isNgo ? t.amount : t.total), 0);
  const fees = transactions.reduce((sum, t) => sum + t.fee, 0);
  const sponsorCount = new Set(transactions.map((t) => t.sponsorId || t.counterpartName).filter(Boolean)).size;
  const latestDate = transactions.length ? formatDate(transactions[0].paidAt) : "None yet";

  const shown = transactions.slice(0, visible);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{isNgo ? "Payments received" : "Payments made"}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{transactions.length}</Text>
        </View>
      </View>

      {/* Summary card */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{isNgo ? "Total received" : "Total paid"}</Text>
        <Text style={styles.heroValue}>{money(total)}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{isNgo ? sponsorCount : money(fees)}</Text>
            <Text style={styles.heroStatLabel}>{isNgo ? (sponsorCount === 1 ? "Sponsor" : "Sponsors") : "Platform fees"}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{transactions.length}</Text>
            <Text style={styles.heroStatLabel}>{transactions.length === 1 ? "Payment" : "Payments"}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue} numberOfLines={1}>{latestDate}</Text>
            <Text style={styles.heroStatLabel}>Latest</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={p.accent} style={{ marginVertical: 24 }} />
      ) : error ? (
        <View style={styles.messageBox}>
          <Ionicons name="cloud-offline-outline" size={28} color={p.muted} style={{ marginBottom: 8 }} />
          <Text style={styles.messageText}>Payments could not be loaded. Check your connection and try again.</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.messageBox}>
          <Ionicons name="receipt-outline" size={28} color={p.muted} style={{ marginBottom: 8 }} />
          <Text style={styles.messageText}>
            {isNgo
              ? "No payments yet. When a sponsor pays towards one of your projects it will appear here."
              : "No payments yet. When you sponsor a project and pay, it will appear here."}
          </Text>
        </View>
      ) : (
        <>
          {shown.map((t) => {
            const isNew = newKeys.includes(t.key);
            const name = t.counterpartName || (isNgo ? "A sponsor" : "Partner organisation");
            const feePercent = Math.round((Number(t.feeRate) || 0) * 100);
            return (
              <View key={t.key} style={[styles.card, isNew && styles.cardNew]}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.party} numberOfLines={1}>
                      {isNgo ? "From " : "To "}
                      {name}
                    </Text>
                    <Text style={styles.subText} numberOfLines={1}>{t.projectTitle || "Project sponsorship"}</Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amount}>
                      {isNgo ? "+" : "-"}
                      {money(isNgo ? t.amount : t.total)}
                    </Text>
                    {isNew ? (
                      <View style={styles.newPill}>
                        <Text style={styles.newPillText}>New</Text>
                      </View>
                    ) : (
                      <Text style={styles.paidText}>Paid</Text>
                    )}
                  </View>
                </View>

                <View style={styles.chipsRow}>
                  <View style={styles.chip}>
                    <Ionicons name="calendar-outline" size={12} color={p.muted} />
                    <Text style={styles.chipText}>{formatDate(t.paidAt)}</Text>
                  </View>
                  {t.fundingType ? (
                    <View style={styles.chip}>
                      <Ionicons name="flag-outline" size={12} color={p.muted} />
                      <Text style={styles.chipText}>{t.fundingType === "milestone" ? "Milestone-based" : "One-off"}</Text>
                    </View>
                  ) : null}
                  {t.method ? (
                    <View style={styles.chip}>
                      <Ionicons name="card-outline" size={12} color={p.muted} />
                      <Text style={styles.chipText} numberOfLines={1}>{t.method}</Text>
                    </View>
                  ) : null}
                </View>

                {!isNgo && t.fee > 0 && (
                  <View style={styles.breakdown}>
                    <View style={styles.line}>
                      <Text style={styles.lineLabel}>Sponsorship</Text>
                      <Text style={styles.lineValue}>{money(t.amount)}</Text>
                    </View>
                    <View style={styles.line}>
                      <Text style={styles.lineLabel}>Platform fee{feePercent ? ` (${feePercent}%)` : ""}</Text>
                      <Text style={styles.lineValue}>{money(t.fee)}</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.reference} numberOfLines={1}>
                  Ref {String(t.reference).slice(0, 18).toUpperCase()}
                </Text>
              </View>
            );
          })}

          {transactions.length > PAGE_SIZE && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setVisible(visible >= transactions.length ? PAGE_SIZE : transactions.length)}
              activeOpacity={0.8}
            >
              <Text style={styles.moreButtonText}>
                {visible >= transactions.length ? "Show fewer" : `Show all ${transactions.length}`}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const makeStyles = (p) =>
  StyleSheet.create({
    wrapper: { marginBottom: 20 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
    title: { fontFamily: "Manrope_700Bold", fontSize: 18, color: p.text },
    countPill: { backgroundColor: p.accentSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
    countText: { fontFamily: "Manrope_700Bold", fontSize: 12, color: p.accent },

    hero: { backgroundColor: p.accent, borderRadius: 22, padding: 20, marginBottom: 16 },
    heroLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.85)" },
    heroValue: { fontFamily: "Manrope_700Bold", fontSize: 32, color: COLORS.white, marginTop: 4, letterSpacing: -0.5 },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.25)",
    },
    heroStat: { flex: 1, alignItems: "center" },
    heroStatValue: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.white },
    heroStatLabel: { fontFamily: "Manrope_500Medium", fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2 },
    heroDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.25)" },

    card: {
      backgroundColor: COLORS.white,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: p.border,
    },
    cardNew: { borderColor: p.accent, borderWidth: 1.5 },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: p.accentSoft, alignItems: "center", justifyContent: "center" },
    avatarText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: p.accent },
    party: { fontFamily: "Manrope_700Bold", fontSize: 15, color: p.text },
    subText: { fontFamily: "Manrope_500Medium", fontSize: 12, color: p.muted, marginTop: 2 },
    amountCol: { alignItems: "flex-end" },
    amount: { fontFamily: "Manrope_700Bold", fontSize: 16, color: p.accent },
    paidText: { fontFamily: "Manrope_600SemiBold", fontSize: 11, color: p.muted, marginTop: 3 },
    newPill: { backgroundColor: p.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
    newPillText: { fontFamily: "Manrope_700Bold", fontSize: 10, color: COLORS.white },

    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
    chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: p.accentSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, maxWidth: "100%" },
    chipText: { fontFamily: "Manrope_600SemiBold", fontSize: 11, color: p.text },

    breakdown: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.border },
    line: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    lineLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: p.muted },
    lineValue: { fontFamily: "Manrope_600SemiBold", fontSize: 12, color: p.text },
    reference: { fontFamily: "Manrope_500Medium", fontSize: 10, color: p.muted, marginTop: 10, letterSpacing: 0.3 },

    messageBox: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: p.border, padding: 24, alignItems: "center" },
    messageText: { fontFamily: "Manrope_500Medium", fontSize: 14, color: p.muted, textAlign: "center", lineHeight: 21 },

    moreButton: { height: 46, borderRadius: 14, borderWidth: 1, borderColor: p.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
    moreButtonText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: p.accent },
  });