//Tshepo 
// Currency formatting helpers for South African Rand (R) amounts used
// throughout sponsor & NGO screens.

/**
 * Formats a number as a full Rand amount with thousands separators.
 * e.g. formatCurrency(180000) -> "R180,000"
 */
export function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "R0";

    return `R${Math.round(amount).toLocaleString("en-ZA")}`;
}

/**
 * Formats a number as a short, rounded Rand amount for dashboards/stats.
 * e.g. formatCurrencyShort(4200000) -> "R4.2M"
 *      formatCurrencyShort(150000)  -> "R150k"
 *      formatCurrencyShort(900)     -> "R900"
 */
export function formatCurrencyShort(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "R0";

    const abs = Math.abs(amount);

    if (abs >= 1000000) {
        return `R${(amount / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }

    if (abs >= 1000) {
        return `R${(amount / 1000).toFixed(0)}k`;
    }

    return `R${amount}`;
}

/**
 * Formats a funding range using the short form.
 * e.g. formatFundingRange(150000, 300000) -> "R150k – R300k"
 */
export function formatFundingRange(min, max) {
    return `${formatCurrencyShort(min)} – ${formatCurrencyShort(max)}`;
}

export default formatCurrency;