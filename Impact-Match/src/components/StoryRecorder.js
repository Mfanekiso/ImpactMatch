import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Platform,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
} from "expo-audio";

import { transcribeStory, friendlyAiError } from "../utils/aiApi";

const COLORS = {
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    border: "#E5E7EB",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    danger: "#EF4444",
    white: "#FFFFFF",
    warnBg: "#FFFBEB",
    warnText: "#92400E",
};

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "zu", label: "isiZulu" },
    { code: "st", label: "Sesotho" },
];

const MAX_SECONDS = 90;

function guessMime(uri) {
    const ext = (uri.split(".").pop() || "m4a").toLowerCase();
    const map = { m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", wav: "audio/wav", mp3: "audio/mpeg", ogg: "audio/ogg" };
    return { ext, mimeType: map[ext] || "audio/mp4" };
}

// Read a local file as base64 without needing extra native packages.
async function readAsBase64(uri) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read the recording."));
        reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
        reader.readAsDataURL(blob);
    });
}

// "Speak your story": record up to 90 seconds, send to the AI, and hand the extracted
// profile fields back through onResult(fields). The parent decides what to fill in.
export default function StoryRecorder({ onResult }) {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

    const [language, setLanguage] = useState("en");
    const [status, setStatus] = useState("idle"); // idle | recording | processing
    const [seconds, setSeconds] = useState(0);
    const [heard, setHeard] = useState(null); // { transcript, english }
    const [error, setError] = useState("");
    const timerRef = useRef(null);
    const isRecordingRef = useRef(false);
    const languageRef = useRef("en");
    const finishRef = useRef(null);

    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    useEffect(() => () => clearInterval(timerRef.current), []);

    // Audio formats we send are not produced by browsers, so keep this to the phone app.
    if (Platform.OS === "web") return null;

    const stopTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const startRecording = async () => {
        setError("");
        setHeard(null);
        try {
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Microphone needed", "Please allow microphone access in your phone settings to use voice setup.");
                return;
            }
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await recorder.prepareToRecordAsync();
            recorder.record();

            const startedAt = Date.now();
            isRecordingRef.current = true;
            setSeconds(0);
            setStatus("recording");
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startedAt) / 1000);
                setSeconds(elapsed);
                if (elapsed >= MAX_SECONDS) finishRef.current?.();
            }, 500);
        } catch (e) {
            setStatus("idle");
            setError("Could not start recording. Please try again.");
        }
    };

    const finishRecording = async () => {
        if (!isRecordingRef.current) return; // already finishing
        isRecordingRef.current = false;
        stopTimer();
        setStatus("processing");
        try {
            await recorder.stop();
            await setAudioModeAsync({ allowsRecording: false });
            const uri = recorder.uri;
            if (!uri) throw new Error("No recording was captured.");

            const { ext, mimeType } = guessMime(uri);
            const audioBase64 = await readAsBase64(uri);
            const result = await transcribeStory({
                audioBase64,
                mimeType,
                fileName: `story.${ext}`,
                language: languageRef.current,
            });

            setHeard({ transcript: result.transcript, english: result.english });
            onResult?.(result.fields, result);
        } catch (e) {
            setError(friendlyAiError(e));
        } finally {
            setStatus("idle");
        }
    };

    finishRef.current = finishRecording;

    const recording = status === "recording";
    const processing = status === "processing";

    return (
        <View style={styles.card}>
            <View style={styles.titleRow}>
                <Ionicons name="mic-outline" size={20} color={COLORS.primary} />
                <Text style={styles.title}>Speak your story</Text>
            </View>
            <Text style={styles.subtitle}>
                Tell us about your organisation in your own words and we'll fill in the form for you.
                You can check and change everything afterwards.
            </Text>

            <View style={styles.langRow}>
                {LANGUAGES.map((lang) => {
                    const active = language === lang.code;
                    return (
                        <TouchableOpacity
                            key={lang.code}
                            disabled={status !== "idle"}
                            style={[styles.langChip, active && styles.langChipActive]}
                            onPress={() => setLanguage(lang.code)}
                        >
                            <Text style={[styles.langText, active && styles.langTextActive]}>{lang.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={[styles.micButton, recording && styles.micButtonRecording, processing && styles.micButtonDisabled]}
                activeOpacity={0.85}
                disabled={processing}
                onPress={recording ? finishRecording : startRecording}
            >
                {processing ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Ionicons name={recording ? "stop" : "mic"} size={22} color={COLORS.white} />
                )}
                <Text style={styles.micText}>
                    {processing
                        ? "Listening to your story…"
                        : recording
                        ? `Tap to finish  •  0:${String(seconds).padStart(2, "0")}`
                        : "Tap to start speaking"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
                {recording
                    ? "Mention your name, what you do, who you help, where you work and how much funding you need."
                    : `Up to ${MAX_SECONDS} seconds. Try to speak in a quiet place.`}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {heard ? (
                <View style={styles.heardBox}>
                    <Text style={styles.heardTitle}>What we heard</Text>
                    <Text style={styles.heardText} numberOfLines={6}>{heard.transcript}</Text>
                    {heard.english && heard.english !== heard.transcript ? (
                        <Text style={[styles.heardText, styles.heardEnglish]} numberOfLines={6}>
                            In English: {heard.english}
                        </Text>
                    ) : null}
                    <Text style={styles.heardNote}>
                        AI can mishear names and numbers. Please check the fields below before you continue.
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 20,
        padding: 18,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.25)",
    },
    titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    title: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginLeft: 8 },
    subtitle: { fontSize: 13.5, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 14 },
    langRow: { flexDirection: "row", marginBottom: 14 },
    langChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        marginRight: 8,
    },
    langChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    langText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
    langTextActive: { color: COLORS.white },
    micButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 54,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
    },
    micButtonRecording: { backgroundColor: COLORS.danger },
    micButtonDisabled: { opacity: 0.8 },
    micText: { color: COLORS.white, fontSize: 15, fontWeight: "700", marginLeft: 10 },
    hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, lineHeight: 18 },
    error: { fontSize: 13, color: COLORS.danger, marginTop: 10, lineHeight: 18 },
    heardBox: {
        marginTop: 14,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    heardTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 6 },
    heardText: { fontSize: 13.5, color: COLORS.textPrimary, lineHeight: 20 },
    heardEnglish: { marginTop: 8, color: COLORS.textSecondary },
    heardNote: {
        fontSize: 12,
        color: COLORS.warnText,
        backgroundColor: COLORS.warnBg,
        borderRadius: 8,
        padding: 8,
        marginTop: 10,
        lineHeight: 17,
    },
});