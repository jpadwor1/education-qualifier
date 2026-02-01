from __future__ import annotations
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from src.schemas import ApplicationPayload
from src.predict import load_models, predict_stage1, predict_stage2
from src.explain import build_stage2_explanations


def create_app() -> Flask:
    static_dir = Path(__file__).parent / "static"
    app = Flask(__name__, static_folder=str(static_dir), static_url_path="/")

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    artifacts_dir = Path(__file__).parent / "artifacts"
    bundle = load_models(artifacts_dir)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/metadata")
    def metadata():
        return jsonify({
            "stage1": {"metrics": bundle.stage1_metrics, "ui_metadata": bundle.stage1_ui_meta},
            "stage2": {"metrics": bundle.stage2_metrics, "ui_metadata": bundle.stage2_ui_meta},
        })

    @app.post("/api/qualify")
    def qualify():
        try:
            body = request.get_json(force=True) or {}
            payload_obj = ApplicationPayload.from_json(body)

            payload: Dict[str, Any] = {
                "loan_amount": payload_obj.loan_amount,
                "term": payload_obj.term,
                "purpose": payload_obj.purpose,
                "annual_income": payload_obj.annual_income,
                "emp_length": payload_obj.emp_length,
                "dti": payload_obj.dti,
                "utilization": payload_obj.utilization,
                "delinquencies": payload_obj.delinquencies,
                "fico": payload_obj.fico,
            }

            s1 = predict_stage1(bundle, payload)
            s2 = predict_stage2(bundle, payload)
            exp = build_stage2_explanations(payload, s2)

            return jsonify({
                "stage1": s1,
                "stage2": s2,
                "explanations": exp,
                "disclaimer": "Educational demo. No PII collected. Not financial advice.",
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.get("/")
    def serve_index():
        index_path = static_dir / "index.html"
        if index_path.exists():
            return send_from_directory(static_dir, "index.html")
        return (
            "Frontend not built. Build frontend into server/static via Docker or `npm run build`.",
            200,
        )

    @app.get("/<path:path>")
    def serve_static_or_spa(path: str):
        file_path = static_dir / path
        if file_path.exists():
            return send_from_directory(static_dir, path)
        return send_from_directory(static_dir, "index.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
