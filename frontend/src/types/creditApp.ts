export type StepIndex = 0 | 1 | 2 | 3;

export type MetadataNumeric = {
  min: number;
  max: number;
  recommended_min?: number;
  recommended_max?: number;
  p1?: number;
  p99?: number;
  unit?: string;
};

export type Metadata = {
  loan_amount: MetadataNumeric;
  annual_income: MetadataNumeric;
  dti: MetadataNumeric;
  utilization: MetadataNumeric;
  delinquencies: MetadataNumeric;
  fico: MetadataNumeric;
  purposes: string[];
  terms: number[];
};

export type FormData = {
  loan_amount: number;
  term: number;
  purpose: string;
  annual_income: number;
  emp_length: number;
  dti: number;
  utilization: number;
  delinquencies: number;
  fico: number;
  disclaimer: boolean;
};

export type Preset = {
  name: string;
  data: Omit<FormData, "disclaimer">;
};

export type Results = {
  p_accept: number;
  p_bad: number;
  decision: "Approve" | "Refer" | "Decline";
  band: "Low" | "Medium" | "High";
  apr: string;
  drivers: string[];
  suggestions: string[];
};

export type ApiQualifyResponse = {
  stage1: {
    accept_probability: number;
    threshold: number;
    decision: "approve" | "refer";
  };
  stage2: {
    default_probability: number;
    risk_band: "Low" | "Medium" | "High";
    thresholds?: { medium?: number; high?: number };
  };
  explanations?: {
    summary?: string;
    drivers?: string[];
    suggestions?: string[];
    disclaimer?: string;
  };
  disclaimer?: string;
};
