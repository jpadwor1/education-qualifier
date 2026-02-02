import type { FormData } from "../types/creditApp";

export default function StepReview({
    formData,
    setDisclaimer,
}: {
    formData: FormData;
    setDisclaimer: (v: boolean) => void;
}) {
    return (
        <div className="space-y-8 fade-in">
            <h2 className="text-2xl font-extrabold tracking-tight">Review & Attestation</h2>

            <div className="vellum-layer p-6 space-y-4 bg-white/40">
                <div className="grid grid-cols-2 gap-4 mono text-xs">
                    <div>
                        <p className="text-gray-400">LOAN</p>
                        <p className="text-sm font-bold">${formData.loan_amount} @ {formData.term}mo</p>
                    </div>
                    <div>
                        <p className="text-gray-400">PURPOSE</p>
                        <p className="text-sm font-bold uppercase">{formData.purpose}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">INCOME</p>
                        <p className="text-sm font-bold">${formData.annual_income} / yr</p>
                    </div>
                    <div>
                        <p className="text-gray-400">CREDIT</p>
                        <p className="text-sm font-bold">FICO: {formData.fico} | DTI: {formData.dti}%</p>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50/50 p-4 border border-blue-100">
                <input
                    type="checkbox"
                    id="disclaimer"
                    className="mt-1"
                    checked={formData.disclaimer}
                    onChange={(e) => setDisclaimer(e.target.checked)}
                />
                <label htmlFor="disclaimer" className="text-xs leading-relaxed text-blue-900">
                    I understand this is an <strong>educational demonstration</strong> based on historical training data. I am
                    providing truthful inputs for the purpose of learning how credit modeling works.
                </label>
            </div>
        </div>
    );
}
