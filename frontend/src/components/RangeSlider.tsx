type Props = {
    label: string;
    value: number;
    min: number;
    max: number;
    hint?: string;
    onChange: (v: number) => void;
};

export default function RangeSlider({ label, value, min, max, hint, onChange }: Props) {
    return (
        <div className="flex flex-col">
            <label className="mono text-xs uppercase font-bold text-gray-500">{label}</label>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="custom-range mt-4 mb-2"
            />
            <div className="flex justify-between text-xl font-light">
                <span>{value}%</span>
            </div>
            {hint ? <span className="range-label">{hint}</span> : null}
        </div>
    );
}
