import type { Metadata, Preset, FormData } from "../types/creditApp";

export const METADATA: Metadata = {
  loan_amount: {
    min: 1000,
    max: 50000,
    recommended_min: 5000,
    recommended_max: 35000,
    p1: 1000,
    p99: 45000,
  },
  annual_income: {
    min: 10000,
    max: 250000,
    recommended_min: 35000,
    recommended_max: 150000,
  },
  dti: { min: 0, max: 60, recommended_min: 0, recommended_max: 45, unit: "%" },
  utilization: {
    min: 0,
    max: 100,
    recommended_min: 5,
    recommended_max: 90,
    unit: "%",
  },
  delinquencies: { min: 0, max: 10, recommended_min: 0, recommended_max: 2 },
  fico: { min: 300, max: 850, recommended_min: 580, recommended_max: 820 },
  purposes: [
    "Debt Consolidation",
    "Home Improvement",
    "Major Purchase",
    "Emergency",
    "Small Business",
  ],
  terms: [36, 60],
};

export const PRESETS: Preset[] = [
  {
    name: "Prime",
    data: {
      loan_amount: 15000,
      term: 36,
      purpose: "Major Purchase",
      annual_income: 95000,
      emp_length: 10,
      dti: 12,
      utilization: 15,
      delinquencies: 0,
      fico: 780,
    },
  },
  {
    name: "Near-prime",
    data: {
      loan_amount: 10000,
      term: 60,
      purpose: "Debt Consolidation",
      annual_income: 55000,
      emp_length: 5,
      dti: 28,
      utilization: 45,
      delinquencies: 0,
      fico: 660,
    },
  },
  {
    name: "Thin file",
    data: {
      loan_amount: 5000,
      term: 36,
      purpose: "Emergency",
      annual_income: 42000,
      emp_length: 2,
      dti: 15,
      utilization: 5,
      delinquencies: 0,
      fico: 610,
    },
  },
  {
    name: "High DTI",
    data: {
      loan_amount: 25000,
      term: 60,
      purpose: "Debt Consolidation",
      annual_income: 60000,
      emp_length: 8,
      dti: 48,
      utilization: 30,
      delinquencies: 0,
      fico: 690,
    },
  },
  {
    name: "Edge Case",
    data: {
      loan_amount: 50000,
      term: 60,
      purpose: "Small Business",
      annual_income: 15000,
      emp_length: 0,
      dti: 55,
      utilization: 95,
      delinquencies: 5,
      fico: 520,
    },
  },
];

export const DEFAULT_FORM: FormData = {
  loan_amount: 10000,
  term: 36,
  purpose: "Debt Consolidation",
  annual_income: 50000,
  emp_length: 2,
  dti: 20,
  utilization: 30,
  delinquencies: 0,
  fico: 700,
  disclaimer: false,
};
