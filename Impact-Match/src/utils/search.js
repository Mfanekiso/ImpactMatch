// Full-text search for Discover.
//
// 1. If Algolia is configured (src/config/algolia.js), the query is sent to the
//    Algolia Search API, which ranks results and tolerates typos.
// 2. Otherwise (or if Algolia cannot be reached) the same kind of search runs on the
//    device: every word must match the start of a word in the record, and words of
//    5+ letters may have one typo ("edcation" still finds "Education").

import { ALGOLIA } from "../config/algolia";

export const algoliaEnabled = () => Boolean(ALGOLIA.appId && ALGOLIA.searchKey);

const words = (text) =>
    String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

// Levenshtein distance, stopping early once it is above `max`
function editDistance(a, b, max = 1) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            rowMin = Math.min(rowMin, cur[j]);
        }
        if (rowMin > max) return max + 1;
        prev = cur;
    }
    return prev[b.length];
}

function termMatches(term, recordWords) {
    return recordWords.some(
        (w) =>
            w.startsWith(term) ||
            (term.length >= 5 && (editDistance(term, w.slice(0, term.length), 1) <= 1 || editDistance(term, w, 1) <= 1))
    );
}

// True when every word of the query is found in the record's fields.
export function matchesQuery(query, fields = []) {
    const terms = words(query);
    if (terms.length === 0) return true;
    const recordWords = words(fields.flat().join(" "));
    return terms.every((t) => termMatches(t, recordWords));
}

// Returns the matching record ids from Algolia, best match first, or null if
// Algolia is not configured or the request failed (the caller then searches locally).
export async function searchAlgolia(indexName, query, extraParams = {}) {
    if (!algoliaEnabled() || !String(query || "").trim()) return null;
    try {
        const res = await fetch(`https://${ALGOLIA.appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`, {
            method: "POST",
            headers: {
                "X-Algolia-Application-Id": ALGOLIA.appId,
                "X-Algolia-API-Key": ALGOLIA.searchKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, hitsPerPage: 100, ...extraParams }),
        });
        if (!res.ok) throw new Error(`Algolia ${res.status}`);
        const data = await res.json();
        return (data.hits || []).map((h) => h.objectID);
    } catch (error) {
        console.log("Algolia search unavailable, using on-device search:", error?.message);
        return null;
    }
}

// Keep `items` whose id is in `ids`, in Algolia's ranking order.
export function orderByIds(items, ids) {
    const rank = new Map(ids.map((id, i) => [id, i]));
    return items.filter((x) => rank.has(x.id)).sort((a, b) => rank.get(a.id) - rank.get(b.id));
}
