from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class ApplicationPayload:
    loan_amount: float
    term: int
    purpose: str
    annual_income: float
    emp_length: float
    dti: float
    utilization: float
    delinquencies: float
    fico: float  

    @staticmethod
    def from_json(data: Dict[str, Any]) -> "ApplicationPayload":
        def req(name: str):
            if name not in data:
                raise ValueError(f"Missing required field: {name}")
            return data[name]

        payload = ApplicationPayload(
            loan_amount=float(req("loan_amount")),
            term=int(req("term")),
            purpose=str(req("purpose")),
            annual_income=float(req("annual_income")),
            emp_length=float(req("emp_length")),
            dti=float(req("dti")),
            utilization=float(req("utilization")),
            delinquencies=float(req("delinquencies")),
            fico=float(req("fico")),
        )

        if payload.loan_amount < 0:
            raise ValueError("loan_amount must be >= 0")
        if payload.term not in (36, 60):
            # keep flexible, but most LC terms are 36/60
            raise ValueError("term must be 36 or 60")
        if not payload.purpose:
            raise ValueError("purpose must be a non-empty string")

        payload.dti = max(0.0, min(payload.dti, 80.0))
        payload.utilization = max(0.0, min(payload.utilization, 100.0))
        payload.fico = max(300.0, min(payload.fico, 850.0))
        payload.emp_length = max(0.0, min(payload.emp_length, 50.0))
        payload.delinquencies = max(0.0, min(payload.delinquencies, 50.0))
        payload.annual_income = max(0.0, payload.annual_income)

        return payload
