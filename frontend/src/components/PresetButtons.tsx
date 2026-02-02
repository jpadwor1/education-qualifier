import type { Preset } from "../types/creditApp";

export default function PresetButtons({
    presets,
    onApply,
}: {
    presets: Preset[];
    onApply: (p: Preset) => void;
}) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {presets.map((p) => (
                <button key={p.name} onClick={() => onApply(p)} className="btn-preset whitespace-nowrap">
                    {p.name}
                </button>
            ))}
        </div>
    );
}
