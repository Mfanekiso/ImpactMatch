import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

// Reuse the same palette as SponsorProfileScreen so this modal
// feels like part of the same screen, not a bolted-on piece.
const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    headerBg: "#0F1B3D",
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.12)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    danger: "#EF4444",
    muted: "#94A3B8",
};

// Reusable labeled input with a leading Ionicons icon.
function FieldInput({ icon, label, required, value, onChangeText, keyboardType, multiline }) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>
                {label}
                {required ? <Text style={styles.required}> *</Text> : null}
            </Text>
            <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
                <Ionicons
                    name={icon}
                    size={18}
                    color={COLORS.textSecondary}
                    style={multiline ? styles.iconMultiline : styles.icon}
                />
                <TextInput
                    style={[styles.input, multiline && styles.inputMultiline]}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType || "default"}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    placeholderTextColor={COLORS.muted}
                />
            </View>
        </View>
    );
}

export default function EditProfileModal({ visible, onClose, onSave, initialProfile }) {
    const [orgName, setOrgName] = useState(initialProfile?.orgName ?? "GreenFuture Foundation");
    const [email, setEmail] = useState(initialProfile?.email ?? "info@greenfuture.org");
    const [phone, setPhone] = useState(initialProfile?.phone ?? "+27 21 555 0148");
    const [website, setWebsite] = useState(initialProfile?.website ?? "https://greenfuture.org");
    const [location, setLocation] = useState(initialProfile?.location ?? "Cape Town, South Africa");
    const [description, setDescription] = useState(
        initialProfile?.description ??
            "GreenFuture Foundation is dedicated to environmental conservation and sustainable community development across the Western Cape."
    );

    const handleChangePhoto = () => {
        // Wire up to your image picker of choice, e.g. expo-image-picker or
        // react-native-image-picker. For now this is a no-op placeholder.
        console.log("Open image picker here");
    };

    const handleSave = () => {
        onSave?.({ orgName, email, phone, website, location, description });
        onClose?.();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Profile photo section */}
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarWrapper}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {orgName
                                            .split(" ")
                                            .map((w) => w[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.changePhotoBadge} onPress={handleChangePhoto}>
                                <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
                                <Text style={styles.changePhotoText}>Change Photo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form fields */}
                        <FieldInput
                            icon="business-outline"
                            label="Organisation Name"
                            required
                            value={orgName}
                            onChangeText={setOrgName}
                        />
                        <FieldInput
                            icon="mail-outline"
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                        <FieldInput
                            icon="call-outline"
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <FieldInput
                            icon="globe-outline"
                            label="Website"
                            value={website}
                            onChangeText={setWebsite}
                            keyboardType="url"
                        />
                        <FieldInput
                            icon="location-outline"
                            label="Location"
                            value={location}
                            onChangeText={setLocation}
                        />

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Short Description</Text>
                            <TextInput
                                style={styles.textArea}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                placeholderTextColor={COLORS.muted}
                            />
                        </View>
                    </ScrollView>

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
    },
    avatarWrapper: {
        marginRight: 16,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.headerBg,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: "800",
    },
    changePhotoBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        gap: 6,
    },
    changePhotoText: {
        color: COLORS.primary,
        fontWeight: "700",
        fontSize: 13,
    },
    fieldGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    required: {
        color: COLORS.danger,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
    },
    inputWrapperMultiline: {
        alignItems: "flex-start",
        paddingVertical: 10,
    },
    icon: {
        marginRight: 8,
    },
    iconMultiline: {
        marginRight: 8,
        marginTop: 2,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    inputMultiline: {
        paddingVertical: 0,
        minHeight: 60,
    },
    textArea: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        padding: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
        minHeight: 100,
    },
    actionRow: {
        flexDirection: "row",
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    cancelButtonText: {
        color: COLORS.textPrimary,
        fontWeight: "700",
        fontSize: 15,
    },
    saveButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: "800",
        fontSize: 15,
    },
});