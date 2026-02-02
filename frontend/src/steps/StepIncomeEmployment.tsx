import type { FormData, Metadata } from "../types/creditApp";



export default function StepIncomeEmployment({
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
            <h2 className="text-2xl font-extrabold tracking-tight">Income & Employment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Annual Income ($)</label>
                    <input
                        type="number"
                        value={formData.annual_income}
                        onChange={(e) => updateField("annual_income", Number(e.target.value))}
                        className="input-underlined text-xl font-light"
                    />
                    <span className="range-label">
                        Training range: ${metadata.annual_income.min}-${metadata.annual_income.max} | Typical: $
                        {metadata.annual_income.recommended_min}-${metadata.annual_income.recommended_max}
                    </span>
                </div>

                <div className="flex flex-col">
                    <label className="mono text-xs uppercase font-bold text-gray-500">Employment Length</label>
                    <input

                        type="number"
                        value={formData.emp_length}
                        onChange={(e) => updateField("emp_length", Number(e.target.value))}
                        className="input-underlined text-xl font-light bg-transparent"
                    />

                </div>
            </div>
        </div>
    );
}
