import { useMemo, useState } from "react";
import type { ApiQualifyResponse, FormData, Preset, Results, StepIndex } from "./types/creditApp";
import { DEFAULT_FORM, METADATA, PRESETS } from "./data/creditAppData";

import StepProgress from "./components/StepProgress";
import PresetButtons from "./components/PresetButtons";
import StatusPill from "./components/StatusPill";

import StepLoanRequest from "./steps/StepLoanRequest";
import StepIncomeEmployment from "./steps/StepIncomeEmployment";
import StepDebtCredit from "./steps/StepDebtCredit";
import StepReview from "./steps/StepReview";
import githubLogo from "./assets/github.svg";

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
}

function calculateResult(formData: FormData): Results {
    const { dti, fico, utilization, delinquencies, annual_income, loan_amount } = formData;

    let p_accept = 100;
    p_accept -= dti > 40 ? 40 : dti * 0.5;
    p_accept -= utilization > 70 ? 30 : utilization * 0.2;
    p_accept -= delinquencies * 15;
    p_accept += (fico - 600) / 4;
    p_accept = clamp(p_accept, 5, 98);

    let p_bad = 0;
    if (p_accept > 20) {
        p_bad = (100 - fico / 8.5) + dti / 2 + utilization / 3;
        p_bad = clamp(p_bad, 2, 95);
    }

    let decision: Results["decision"] = "Refer";
    if (p_accept > 75) decision = "Approve";
    if (p_accept < 30 || delinquencies > 3) decision = "Decline";

    let band: Results["band"] = "High";
    let apr = "18%+";
    if (p_bad < 15) { band = "Low"; apr = "7% - 11%"; }
    else if (p_bad < 35) { band = "Medium"; apr = "12% - 17%"; }

    const drivers: string[] = [];
    if (dti > 35) drivers.push("DTI is high compared to typical applicants");
    if (utilization > 50) drivers.push("Revolving utilization is elevated");
    if (fico < 650) drivers.push("Credit score bucket is below prime thresholds");
    if (loan_amount > annual_income * 0.4) drivers.push("Loan-to-income ratio increases risk");
    if (drivers.length === 0) drivers.push("Strong historical credit alignment", "Sustainable income-to-debt ratio");

    const suggestions: string[] = [];
    if (dti > 20) suggestions.push(`Reducing DTI from ${dti}% → 20% would likely improve approval odds.`);
    if (utilization > 30) suggestions.push(`Lowering utilization from ${utilization}% → 30% reduces predicted default risk.`);
    if (delinquencies > 0) suggestions.push("Consistent on-time payments over the next 12 months will significantly boost profile.");

    return { p_accept, p_bad, decision, band, apr, drivers: drivers.slice(0, 3), suggestions: suggestions.slice(0, 2) };
}

async function postQualify(formData: FormData): Promise<ApiQualifyResponse> {
    const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `API error (${res.status})`);
    }
    return res.json();
}

export default function CreditApp() {
    const [step, setStep] = useState<StepIndex>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
    const [apiResult, setApiResult] = useState<ApiQualifyResponse | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setApiResult(null);
        setSubmitError(null);
        const metaAny = (METADATA as any)[field] as { min?: number; max?: number } | undefined;
        if (typeof value === "number" && metaAny?.min != null && metaAny?.max != null) {
            const clamped = clamp(value as number, metaAny.min, metaAny.max) as FormData[K];
            setFormData((prev) => ({ ...prev, [field]: clamped }));
            return;
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const applyPreset = (preset: Preset) => {
        setFormData((prev) => ({ ...preset.data, disclaimer: prev.disclaimer }));
        setStep(0);
        setIsSubmitted(false);
        setApiResult(null);
        setSubmitError(null);
    };

    const fallbackResults = useMemo(() => calculateResult(formData), [formData]);

    const results: Results = useMemo(() => {
        if (!apiResult) return fallbackResults;

        const p_accept = apiResult.stage1.accept_probability * 100;
        const p_bad = apiResult.stage2.default_probability * 100;

        const decision: Results["decision"] =
            apiResult.stage1.decision === "approve" ? "Approve" : "Refer";

        const band: Results["band"] = apiResult.stage2.risk_band;

        const apr =
            band === "Low" ? "7% - 11%" : band === "Medium" ? "12% - 17%" : "18%+";

        const drivers = apiResult.explanations?.drivers?.slice(0, 3) ?? fallbackResults.drivers;
        const suggestions = apiResult.explanations?.suggestions?.slice(0, 2) ?? fallbackResults.suggestions;

        return { p_accept, p_bad, decision, band, apr, drivers, suggestions };
    }, [apiResult, fallbackResults]);


    const handleNext = () => setStep((s) => (s < 3 ? ((s + 1) as StepIndex) : s));
    const handleBack = () => setStep((s) => (s > 0 ? ((s - 1) as StepIndex) : s));

    const renderStep = () => {
        switch (step) {
            case 0:
                return <StepLoanRequest formData={formData} metadata={METADATA} updateField={updateField} />;
            case 1:
                return <StepIncomeEmployment formData={formData} metadata={METADATA} updateField={updateField} />;
            case 2:
                return <StepDebtCredit formData={formData} metadata={METADATA} updateField={updateField} />;
            case 3:
                return <StepReview formData={formData} setDisclaimer={(v) => updateField("disclaimer", v)} />;
        }
    };

    if (isSubmitted) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-12 fade-in">
                <div className="vellum-layer p-8 md:p-12 space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="space-y-2">
                            <h2 className="mono text-sm font-bold text-gray-400 uppercase tracking-widest">Assessment Outcome</h2>
                            <div className="text-5xl font-extrabold tracking-tighter">{results.decision}</div>
                            <div className="flex gap-2 items-center mt-4">
                                <StatusPill band={results.band} />
                                <span className="mono text-xs font-bold text-gray-500">EST. APR: {results.apr}*</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-l border-gray-100 pl-8">
                            <div>
                                <div className="mono text-[10px] text-gray-400 uppercase">Acceptance Likelihood</div>
                                <div className="text-3xl font-light">{Math.round(results.p_accept)}%</div>
                            </div>
                            <div>
                                <div className="mono text-[10px] text-gray-400 uppercase">Predicted Default Risk</div>
                                <div className="text-3xl font-light">{Math.round(results.p_bad)}%</div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="mono text-xs font-bold uppercase text-gray-500 tracking-widest">Primary Decision Drivers</h3>
                            <ul className="space-y-4">
                                {results.drivers.map((d, i) => (
                                    <li key={i} className="flex gap-3 text-sm">
                                        <span className="text-gray-300 mono">0{i + 1}</span>
                                        <span className="font-medium text-gray-700">{d}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="mono text-xs font-bold uppercase text-gray-500 tracking-widest">Educational Guidance</h3>
                            <div className="space-y-4">
                                {results.suggestions.map((s, i) => (
                                    <div key={i} className="bg-gray-50 p-4 border-l-2 border-gray-900 text-sm italic text-gray-600">
                                        "{s}"
                                    </div>
                                ))}
                                <p className="mono text-[10px] text-gray-400 leading-relaxed uppercase">
                                    Guardrail: Only enter truthful values. Suggestions are educational and do not imply you should
                                    misrepresent information in real applications.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            onClick={() => {
                                setIsSubmitted(false);
                                setApiResult(null);
                                setSubmitError(null);
                            }}
                            className="btn-vellum bg-gray-100 text-white border border-gray-200"
                        >
                            Return to Inputs
                        </button>
                    </div>
                </div>
            </div >
        );
    }

    if (submitError) {
        return (
            <div className="border-l-4 border-amber-400 bg-amber-50/50 p-4 text-xs text-amber-900">
                <span className="mono uppercase tracking-widest font-bold">Offline mode:</span>{" "}
                {submitError}
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-24">
            {/* Banner */}
            <div className="mb-12 border-l-4 border-amber-400 bg-amber-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-extrabold text-sm uppercase tracking-tighter">Educational Credit Qualifier</h1>
                    <p className="text-xs text-amber-800 font-medium">Educational demo only — No PII collected — Not financial advice.</p>
                </div>
                <PresetButtons presets={PRESETS} onApply={applyPreset} />
            </div>

            <div className="vellum-layer p-8 md:p-16 min-h-[500px] flex flex-col justify-between">
                <div>
                    <StepProgress step={step} />
                    {renderStep()}
                </div>

                <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-100">
                    <button
                        onClick={handleBack}
                        className={`mono text-xs font-bold uppercase tracking-widest ${step === 0 ? "opacity-0" : ""}`}
                    >
                        [ Back ]
                    </button>

                    {step < 3 ? (
                        <button onClick={handleNext} className="btn-vellum">
                            Next Phase
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                setIsSubmitting(true);
                                setSubmitError(null);

                                try {
                                    const data = await postQualify(formData);
                                    setApiResult(data);
                                } catch (e: any) {
                                    setApiResult(null);
                                    setSubmitError(e?.message ?? "API not available. Using offline demo mode.");
                                } finally {
                                    setIsSubmitting(false);
                                    setIsSubmitted(true);
                                }
                            }}
                            disabled={!formData.disclaimer || isSubmitting}
                            className={`btn-vellum ${(!formData.disclaimer || isSubmitting) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Application"}
                        </button>
                    )}
                </div>
            </div>

            <footer className="mt-12 text-center space-y-3">
                <a
                    href="https://github.com/jpadwor1/education-qualifier"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mono text-[10px] text-gray-500 uppercase tracking-widest hover:text-gray-800 transition"
                    aria-label="Open GitHub repository"
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center">
                        <img src={githubLogo} alt="GitHub" className="h-4 w-4" />
                    </span>
                    View repo on GitHub
                </a>

                <p className="mono text-[10px] text-gray-400 uppercase tracking-widest">
                    Built with Historical Loan Training Data • Version 4.1.0-ED
                </p>
            </footer>
        </div>
    );
}
