from __future__ import annotations
from typing import Any, Dict, List


def build_stage2_explanations(payload: Dict[str, Any], stage2_out: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule-based explanations that match the UI fields.
    - Drivers: what likely increased risk
    - Suggestions: what could reduce risk
    """
    dti = float(payload.get("dti", 0.0))
    util = float(payload.get("utilization", 0.0))
    fico = float(payload.get("fico", 650.0))
    delinq = float(payload.get("delinquencies", 0.0))
    term = int(payload.get("term", 36))
    loan_amount = float(payload.get("loan_amount", 0.0))
    income = float(payload.get("annual_income", 0.0))

    drivers: List[str] = []
    suggestions: List[str] = []

    #drivers
    if fico < 640:
        drivers.append("Estimated credit score is below typical prime ranges.")
    elif fico < 680:
        drivers.append("Estimated credit score is near-prime, which can increase risk versus prime tiers.")

    if dti >= 35:
        drivers.append("Debt-to-income (DTI) is high relative to typical applicants.")
    elif dti >= 25:
        drivers.append("DTI is moderate; lower DTI often correlates with better outcomes.")

    if util >= 50:
        drivers.append("Revolving utilization is elevated.")
    elif util >= 30:
        drivers.append("Utilization is moderate; lower utilization often reduces risk.")

    if delinq >= 1:
        drivers.append("Recent delinquencies are associated with higher default rates.")

    if term >= 60:
        drivers.append("Longer terms (e.g., 60 months) generally carry higher risk than shorter terms.")

    if income > 0 and loan_amount > (income * 0.4):
        drivers.append("Requested loan amount is high relative to stated annual income.")

    #suggestions
    if util > 30:
        suggestions.append(f"Lower utilization toward ~30% (currently {util:.0f}%) to reduce risk signals.")
    if dti > 25:
        suggestions.append(f"Lower DTI toward ~20–25% (currently {dti:.0f}%) to improve risk profile.")
    if term == 60:
        suggestions.append("If affordable, consider a shorter term (e.g., 36 months) to reduce long-horizon risk.")
    if delinq > 0:
        suggestions.append("Maintaining consistent on-time payments over time can improve risk indicators.")

    #short for UI
    drivers = drivers[:3] if drivers else ["Profile is within typical ranges for several key indicators."]
    suggestions = suggestions[:3] if suggestions else ["Keep key ratios stable (DTI/utilization) and maintain on-time payments."]

    #risk band messaging
    band = stage2_out.get("risk_band", "Medium")
    if band == "High":
        message = "High risk flag: the model estimates a higher chance of default based on the entered inputs."
    elif band == "Medium":
        message = "Medium risk: the model sees some elevated signals; consider the guidance below."
    else:
        message = "Low risk: based on the entered inputs, risk signals are relatively low."

    return {
        "summary": message,
        "drivers": drivers,
        "suggestions": suggestions,
        "disclaimer": (
            "Educational estimate only. Not financial advice. "
            "Do not use this tool to make real lending decisions."
        ),
    }
