from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Tuple

import json
import joblib
import pandas as pd


@dataclass
class ModelBundle:
    stage1_pipe: Any
    stage1_metrics: Dict[str, Any]
    stage1_ui_meta: Dict[str, Any]
    stage2_pipe: Any
    stage2_metrics: Dict[str, Any]
    stage2_ui_meta: Dict[str, Any]


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text())


def load_models(artifacts_dir: Path) -> ModelBundle:
    """
    Loads both stage models + metadata once at app startup.
    """
    s1_pipe = joblib.load(artifacts_dir / "stage1_pipeline.pkl")
    s1_metrics = _load_json(artifacts_dir / "stage1_metrics.json")
    s1_ui = _load_json(artifacts_dir / "stage1_ui_metadata.json")

    s2_pipe = joblib.load(artifacts_dir / "stage2_pipeline.pkl")
    s2_metrics = _load_json(artifacts_dir / "stage2_metrics.json")
    s2_ui = _load_json(artifacts_dir / "stage2_ui_metadata.json")

    return ModelBundle(
        stage1_pipe=s1_pipe,
        stage1_metrics=s1_metrics,
        stage1_ui_meta=s1_ui,
        stage2_pipe=s2_pipe,
        stage2_metrics=s2_metrics,
        stage2_ui_meta=s2_ui,
    )


def _stage1_features(payload: Dict[str, Any]) -> pd.DataFrame:
    """
    Stage 1 was trained on:
      loan_amount, emp_length, dti, fico_est, fico_missing, emp_length_missing
    Frontend provides fico; we map it to fico_est and set missing flags accordingly.
    """
    fico = payload.get("fico", None)
    fico_missing = 1 if fico is None else 0

    emp_length = payload.get("emp_length", None)
    emp_missing = 1 if emp_length is None else 0

    row = {
        "loan_amount": payload["loan_amount"],
        "emp_length": emp_length if emp_length is not None else 0.0,
        "dti": payload["dti"],
        "fico_est": float(fico) if fico is not None else 650.0, 
        "fico_missing": int(fico_missing),
        "emp_length_missing": int(emp_missing),
    }
    return pd.DataFrame([row])


def _stage2_features(payload: Dict[str, Any]) -> pd.DataFrame:
    """
    Stage 2 was trained on UI fields:
      loan_amount, term, purpose, annual_income, emp_length, dti,
      utilization, delinquencies, fico_est, fico_missing, emp_length_missing
    """
    fico = payload.get("fico", None)
    fico_missing = 1 if fico is None else 0

    emp_length = payload.get("emp_length", None)
    emp_missing = 1 if emp_length is None else 0

    row = {
        "loan_amount": payload["loan_amount"],
        "term": payload["term"],
        "purpose": payload["purpose"],
        "annual_income": payload["annual_income"],
        "emp_length": emp_length if emp_length is not None else 0.0,
        "dti": payload["dti"],
        "utilization": payload["utilization"],
        "delinquencies": payload["delinquencies"],
        "fico_est": float(fico) if fico is not None else 650.0,
        "fico_missing": int(fico_missing),
        "emp_length_missing": int(emp_missing),
    }
    return pd.DataFrame([row])


def predict_stage1(bundle: ModelBundle, payload: Dict[str, Any]) -> Dict[str, Any]:
    X1 = _stage1_features(payload)
    proba_accept = float(bundle.stage1_pipe.predict_proba(X1)[:, 1][0])
    threshold = float(bundle.stage1_metrics.get("threshold", 0.5))

    decision = "approve" if proba_accept >= threshold else "refer"

    return {
        "accept_probability": proba_accept,
        "threshold": threshold,
        "decision": decision,
        "inputs_used": X1.iloc[0].to_dict(),
    }


def predict_stage2(bundle: ModelBundle, payload: Dict[str, Any]) -> Dict[str, Any]:
    X2 = _stage2_features(payload)
    proba_default = float(bundle.stage2_pipe.predict_proba(X2)[:, 1][0])

    metrics = bundle.stage2_metrics
    t_high = float(metrics.get("threshold", 0.5))

    band_policy = metrics.get("band_policy", {})
    t_med = None
    try:
        t_med = float(band_policy["risk_bands"]["low"]["max"])
    except Exception:
        t_med = min(0.35, t_high)

    if proba_default >= t_high:
        band = "High"
    elif proba_default >= t_med:
        band = "Medium"
    else:
        band = "Low"

    return {
        "default_probability": proba_default,
        "risk_band": band,
        "thresholds": {"medium": t_med, "high": t_high},
        "inputs_used": X2.iloc[0].to_dict(),
    }
