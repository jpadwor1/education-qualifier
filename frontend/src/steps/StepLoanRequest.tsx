import type { FormData, Metadata } from "../types/creditApp";

export default function StepLoanRequest({
    formData,
    metadata,
    updateField,
}: {
    formData: FormData;
    metadata: Metadata;
    updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}) {
    return (
        <div className="space-y-8 fade-in">
            <h2 className="text-2xl font-extrabold tracking-tight">Loan Request</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Requested Amount ($)</label>
                    <input
                        type="number"
                        value={formData.loan_amount}
                        onChange={(e) => updateField("loan_amount", Number(e.target.value))}
                        className="input-underlined text-xl font-light"
                    />
                    <span className="range-label">
                        Training range: {metadata.loan_amount.min}-{metadata.loan_amount.max} | Typical:{" "}
                        {metadata.loan_amount.recommended_min}-{metadata.loan_amount.recommended_max}
                    </span>
                </div>

                <div className="flex flex-col">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Term (Months)</label>
                    <select
                        value={formData.term}
                        onChange={(e) => updateField("term", Number(e.target.value))}
                        className="input-underlined text-xl font-light bg-transparent"
                    >
                        {metadata.terms.map((t) => (
                            <option key={t} value={t}>
                                {t} Months
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Loan Purpose</label>
                    <select
                        value={formData.purpose}
                        onChange={(e) => updateField("purpose", e.target.value)}
                        className="input-underlined text-lg font-light bg-transparent"
                    >
                        {metadata.purposes.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
