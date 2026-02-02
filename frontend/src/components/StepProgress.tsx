import type { StepIndex } from "../types/creditApp";

export default function StepProgress({ step }: { step: StepIndex }) {
    return (
        <div className="flex gap-4 mb-16">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`step-indicator ${i <= step ? "active" : ""}`} />
            ))}
        </div>
    );
}
