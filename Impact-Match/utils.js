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