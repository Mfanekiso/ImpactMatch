import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { auth, db } from "../../../Backend/firebaseConfig";
import { COLORS, NEUTRAL, StatusBadge, ProgressBar } from "../../components/PayUI";

const DOCUMENTS = [
  { id: "npoCertificate", title: "NPO registration certificate" },
  { id: "bankLetter", title: "Organisation bank confirmation" },
  { id: "addressProof", title: "Organisation proof of address" },
];

export default function NGOVerificationScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    let active = true;
    if (!uid) { setLoading(false); return undefined; }
    getDoc(doc(db, "users", uid)).then((snapshot) => {
      if (active) setProfile(snapshot.exists() ? snapshot.data() : null);
    }).catch((error) => {
      if (active) Alert.alert("Could not load verification", error?.message || "Please try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid]);

  const documents = profile?.verificationDocuments || {};
  const uploadedCount = DOCUMENTS.filter((item) => !!documents[item.id]?.url).length;
  const submitted = profile?.verificationStatus === "in_review" || profile?.verificationStatus === "verified";

  const handleUpload = async (item) => {
    if (!uid) return Alert.alert("Sign in required", "Please sign in again.");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert("Photo access needed", "Allow photo access to upload a clear image of the document.");
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setUploadingId(item.id);
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const storageRef = ref(getStorage(), `verificationDocuments/${uid}/${item.id}-${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      const nextDocuments = { ...documents, [item.id]: { url, fileName: `${item.id}.jpg`, uploadedAt: new Date().toISOString() } };
      await updateDoc(doc(db, "users", uid), { verificationDocuments: nextDocuments });
      setProfile((current) => ({ ...current, verificationDocuments: nextDocuments }));
    } catch (error) {
      Alert.alert("Upload failed", error?.message || "Could not upload that document.");
    } finally { setUploadingId(null); }
  };

  const handleSubmit = async () => {
    if (!uid || uploadedCount !== DOCUMENTS.length) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        verificationStatus: "in_review",
        verificationSubmittedAt: serverTimestamp(),
      });
      setProfile((current) => ({ ...current, verificationStatus: "in_review" }));
      Alert.alert("Submitted for review", "Your organisation documents have been submitted to the admin team.");
    } catch (error) {
      Alert.alert("Could not submit documents", error?.message || "Please try again.");
    } finally { setSubmitting(false); }
  };

  const statusLabel = useMemo(() => {
    const status = profile?.verificationStatus;
    if (status === "verified") return { label: "Verified", tone: "good" };
    if (status === "in_review") return { label: "In review", tone: "wait" };
    if (status === "rejected") return { label: "Changes requested", tone: "wait" };
    return { label: "Not submitted", tone: "off" };
  }, [profile]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Verify your organisation</Text>
            <StatusBadge label={statusLabel.label} tone={statusLabel.tone} />
          </View>
          <Text style={styles.muted}>Upload clear images of organisation documents. Submitted files are reviewed by an administrator.</Text>
          <ProgressBar percent={(uploadedCount / DOCUMENTS.length) * 100} />
          <Text style={styles.muted}>{uploadedCount} of {DOCUMENTS.length} documents uploaded</Text>
        </View>
        <View style={styles.card}>
          {DOCUMENTS.map((item) => {
            const uploaded = !!documents[item.id]?.url;
            const busy = uploadingId === item.id;
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bold}>{item.title}</Text>
                  <Text style={styles.muted}>{uploaded ? "Document uploaded" : "Image file required"}</Text>
                </View>
                {busy ? <ActivityIndicator color={COLORS.primary} /> : (
                  <TouchableOpacity style={styles.uploadButton} onPress={() => handleUpload(item)} disabled={submitted || !!uploadingId}>
                    <Text style={styles.uploadText}>{uploaded ? "Replace" : "Upload"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.note}>Only submit organisation documents. Do not upload beneficiary or personal identity documents here.</Text>
      </ScrollView>
      <View style={styles.bottom}>
        <TouchableOpacity style={[styles.button, (uploadedCount !== DOCUMENTS.length || submitted || submitting) && styles.buttonOff]} onPress={handleSubmit} disabled={uploadedCount !== DOCUMENTS.length || submitted || submitting}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{submitted ? "Submitted for review" : "Submit for review"}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NEUTRAL.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: NEUTRAL.background },
  content: { padding: 20, gap: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: NEUTRAL.border },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: "Manrope_700Bold", fontSize: 18, color: NEUTRAL.text },
  bold: { fontFamily: "Manrope_700Bold", fontSize: 14, color: NEUTRAL.text },
  muted: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 19, color: NEUTRAL.muted },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  uploadButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  uploadText: { fontFamily: "Manrope_700Bold", color: COLORS.primary },
  note: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 19, color: NEUTRAL.muted },
  bottom: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: NEUTRAL.border },
  button: { height: 52, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  buttonOff: { opacity: 0.4 },
  buttonText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.white },
});
