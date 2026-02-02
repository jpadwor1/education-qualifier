import type { Results } from "../types/creditApp";

export default function StatusPill({ band }: { band: Results["band"] }) {
    const cls =
        band === "Low"
            ? "bg-emerald-100 text-emerald-700"
            : band === "Medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700";

    return <span className={`status-pill ${cls}`}>Risk Band: {band}</span>;
}
