export function formatCurrencyShort(value, symbol = "$") {
    const n = Number(value);
    if (!Number.isFinite(n)) return `${symbol}0`;

    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    const trim = (x) => x.toFixed(1).replace(/\.0$/, "");

    if (abs >= 1_000_000_000) return `${sign}${symbol}${trim(abs / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${sign}${symbol}${trim(abs / 1_000_000)}M`;
    if (abs >= 1_000) return `${sign}${symbol}${trim(abs / 1_000)}K`;
    return `${sign}${symbol}${abs}`;
}

export function friendlyError(err) {
    const code = err?.code ?? "";
    if (code === "permission-denied")
        return "Permission denied. Check your Firestore rules and that your account has role \"admin\".";
    if (code === "unavailable") return "Can't reach Firebase. Check your connection.";
    if (code.startsWith("auth/")) {
        switch (code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
            case "auth/invalid-email":
                return "Incorrect email or password.";
            case "auth/too-many-requests":
                return "Too many attempts. Try again in a few minutes.";
            default:
                return "Sign-in failed. Please try again.";
        }
    }
    return err?.message || "Something went wrong.";
}
