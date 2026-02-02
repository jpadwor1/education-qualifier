import type { FormData, Metadata } from "../types/creditApp";
import RangeSlider from "../components/RangeSlider";

export default function StepDebtCredit({
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
            <h2 className="text-2xl font-extrabold tracking-tight">Debt & Credit Snapshot</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RangeSlider
                    label="Debt-to-Income (%)"
                    value={formData.dti}
                    min={metadata.dti.min}
                    max={metadata.dti.max}
                    hint="Training: 0-60% | Typical: 8-28%"
                    onChange={(v) => updateField("dti", v)}
                />

                <RangeSlider
                    label="Revolving Utilization (%)"
                    value={formData.utilization}
                    min={metadata.utilization.min}
                    max={metadata.utilization.max}
                    hint="Training: 0-100% | Typical: 10-40%"
                    onChange={(v) => updateField("utilization", v)}
                />

                <div className="flex flex-col">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Recent Delinquencies</label>
                    <input
                        type="number"
                        value={formData.delinquencies}
                        onChange={(e) => updateField("delinquencies", Number(e.target.value))}
                        className="input-underlined text-xl font-light"
                    />
                    <span className="range-label">Training Max: {metadata.delinquencies.max} | Typical: 0</span>
                </div>

                <div className="flex flex-col">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Estimated FICO Bucket</label>
                    <input
                        type="number"
                        value={formData.fico}
                        onChange={(e) => updateField("fico", Number(e.target.value))}
                        className="input-underlined text-xl font-light"
                    />
                    <span className="range-label">
                        Training: {metadata.fico.min}-{metadata.fico.max} | Typical: 620-780
                    </span>
                </div>
            </div>
        </div>
    );
}
