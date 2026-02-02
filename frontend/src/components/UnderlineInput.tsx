type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
};

export default function UnderlineInput({ label, hint, className, ...rest }: Props) {
    return (
        <div className="flex flex-col">
            <label className="mono text-xs uppercase font-bold text-gray-500">{label}</label>
            <input {...rest} className={`input-underlined text-xl font-light ${className ?? ""}`} />
            {hint ? <span className="range-label">{hint}</span> : null}
        </div>
    );
}
