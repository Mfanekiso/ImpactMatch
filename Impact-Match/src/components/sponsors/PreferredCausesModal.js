import React, { useState, useEffect } from "react";
import { Text, Alert, StyleSheet } from "react-native";

import SheetModal from "./SheetModal";
import CauseChips from "./CauseChips";
import { normalizeCauses } from "../../utils/causes";

const COLORS = { textPrimary: "#0F172A", textSecondary: "#64748B" };

// onSave receives the new array of causes, e.g. ["Education", "Healthcare"]
export default function PreferredCausesModal({ visible, onClose, onSave, initialCauses }) {
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) setSelected(normalizeCauses(initialCauses));
    }, [visible, initialCauses]);

    const handleSave = async () => {
        if (selected.length === 0) {
            Alert.alert("Select a cause", "Please choose at least one cause you would like to support.");
            return;
        }
        setSaving(true);
        try {
            await onSave(selected);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SheetModal
            visible={visible}
            title="Preferred Causes"
            onClose={onClose}
            onSave={handleSave}
            saving={saving}
        >
            <Text style={styles.intro}>Choose the causes you want to support. We use these to find your best matches.</Text>
            <CauseChips selected={selected} onChange={setSelected} />
        </SheetModal>
    );
}

const styles = StyleSheet.create({
    intro: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, marginBottom: 16 },
});