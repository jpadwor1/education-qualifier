# Educational Credit Qualifier (Two-Stage ML) — React + Flask + Docker + CI/CD + AWS EC2 + Nginx

An educational demonstration of a **two-stage credit qualifier** trained on **LendingClub historical loan data** and deployed as a full-stack application:

- **Frontend:** Vite + React + TypeScript + Tailwind CSS (traditional “credit application” UI with **no PII fields**)
- **Backend:** Flask API (serves the API and the built SPA)
- **Models:** scikit-learn pipelines saved as `.pkl` (joblib)
- **Containerization:** Docker (multi-stage build)
- **CI/CD:** GitHub Actions
- **Cloud deployment:** AWS EC2 running **your project image** behind an **nginx** reverse-proxy container

> **Disclaimer:** This project is strictly for educational purposes. It does **not** collect personally identifiable information (PII) and does **not** provide financial advice.

---

## Table of Contents

- [Project Goal](#project-goal)
- [Problem Definition](#problem-definition)
- [Why Machine Learning](#why-machine-learning)
- [Dataset](#dataset)
- [Repository Structure](#repository-structure)
- [Local Setup](#local-setup)
- [Model Training Notebooks](#model-training-notebooks)
- [Serving the Model with Flask](#serving-the-model-with-flask)
- [Docker](#docker)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [AWS EC2 + Nginx Deployment (Step 7)](#aws-ec2--nginx-deployment-step-7)
- [API Reference](#api-reference)
- [Frontend Integration Notes](#frontend-integration-notes)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)

---

## Project Goal

Build a practical end-to-end ML deployment pipeline that:

1. Trains ML models using LendingClub historical loan data.
2. Saves model artifacts (`.pkl`) + evaluation metrics (`.json`) to GitHub.
3. Serves predictions via a Flask API.
4. Packages the full stack in Docker.
5. Uses GitHub Actions for CI/CD.
6. Deploys the container image to cloud infrastructure:
   - (Course step) Heroku
   - (Final steps) AWS EC2 with nginx reverse proxy

---

## Problem Definition

Traditional “approve/deny” decisions are not very educational. This project uses a **two-stage** approach:

### Stage 1 — Acceptance Likelihood

Predict whether an application resembles historically **accepted** vs **rejected** applications.

**Output:**

- acceptance probability / qualifier outcome (approve / refer / decline style)
- supporting signals

### Stage 2 — Default Risk

For loans considered “accepted,” predict risk of negative outcomes based on loan performance.

**Output:**

- default risk probability
- risk band (Low/Medium/High)
- educational explanations + suggestions based on inputs

---

## Why Machine Learning

Credit-related outcomes are influenced by **non-linear relationships** between financial ratios, credit score buckets, and prior negative events. Machine learning is useful because it can:

- model complex relationships between features (e.g., DTI, utilization, delinquencies, FICO buckets)
- generalize from historical training outcomes to new applications
- return probabilistic estimates (not just hard rules)
- support explainability: decision drivers and educational guidance

---

## Dataset

This project uses public LendingClub historical files (downloaded separately):

### Accepted loans

File example: `accepted_2007_to_2018Q4.csv`

`loan_status` distribution (example):

- Fully Paid
- Current
- Charged Off
- Late (31–120 days)
- In Grace Period
- Late (16–30 days)
- Default
- Does not meet the credit policy (Fully Paid / Charged Off)

For **Stage 2 default risk**, the target is derived as:

- **Good:**  
  `Fully Paid`, `Does not meet the credit policy. Status:Fully Paid`

- **Bad:**  
  `Charged Off`, `Default`, `Does not meet the credit policy. Status:Charged Off`

- **Dropped (excluded):**  
  `Current`, late statuses, `In Grace Period`

### Rejected loans

Used for **Stage 1** to learn accepted vs rejected patterns.

Because rejected/accepted schemas differ, features are aligned via canonical transformations (cleaning and standardizing columns).

> **Note:** Raw CSVs can be large. The preprocessing step converts to Parquet and/or creates a sample dataset to speed iteration.

---

## Repository Structure

`````text
.
├── .github/
│   └── workflows/                 # CI/CD pipeline (GitHub Actions)
├── frontend/                      # Vite + React + TypeScript + Tailwind UI
├── ml/                            # Notebooks, training code, experiments
├── server/                        # Flask API, model loading, prediction logic
│   ├── artifacts/                 # model.pkl + metrics.json + ui_metadata.json
│   ├── src/
│   │   ├── predict.py             # load_models, predict_stage1/2
│   │   ├── schemas.py             # request payload validation
│   │   └── explain.py             # explanations for outputs
│   └── app.py                     # Flask app + API routes + SPA hosting
├── Dockerfile                     # Multi-stage Docker build (frontend + server)
├── Procfile                       # Heroku process definition (gunicorn)
└── README.md

`````

## Local Setup

### Prerequisites

- Python 3.11+ recommended
- Node 20+ recommended
- Docker Desktop or Docker Engine

### 1) Clone repository

````bash
git clone https://github.com/jpadwor1/education-qualifier.git
cd education-qualifier

2) Python environment (server)
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt

3) Node dependencies (frontend)
cd frontend
npm install
cd ..

## Model Training Notebooks

Training occurs in **Jupyter Notebook** / **Google Colab** and includes:

1. **Loading & exploring** raw data *(accepted + rejected)*
2. **Cleaning** and **canonicalizing** columns
3. **Feature engineering** and **feature selection**
4. **Train / validation / test split**
5. **Model selection** (best-performing pipeline)
6. **Metrics evaluation**
   - ROC-AUC
   - PR-AUC
   - Precision / Recall
   - Confusion Matrix
7. **Exporting artifacts**
   - `model pipeline .pkl` via `joblib`
   - `metrics.json` with threshold + classification report
   - `ui_metadata.json` with min/max ranges + categorical values for UI

Artifacts are saved into:

server/artifacts/


Recommended artifact naming:

- `stage1_model.pkl`
- `stage1_metrics.json`
- `stage1_ui_metadata.json`
- `stage2_model.pkl`
- `stage2_metrics.json`
- `stage2_ui_metadata.json`

---

## Serving the Model with Flask

The Flask app:

- loads both models at startup from `server/artifacts`
- exposes `POST /api/qualify` for prediction
- serves the built frontend from `server/static/`

### Run Flask locally

```bash
cd server
python app.py
`````

### Verify endpoints

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/metadata
```

---

## Docker

This project uses a **multi-stage Docker build**:

- Stage 1: builds the React frontend (`vite build`)
- Stage 2: installs Python dependencies and copies `server/` + artifacts
- Final image serves:
  - API endpoints (`/api/*`)
  - health endpoint (`/health`)
  - SPA frontend (`/`)

### Build locally

```bash
docker build -t education-qualifier:local .
```

### Run locally

```bash
docker run -p 5000:5000 education-qualifier:local
```

### Verify

```bash
curl http://localhost:5000/health
```

Open:

- http://localhost:5000/

---

## CI/CD with GitHub Actions

GitHub Actions is used to:

- build the Docker image
- (optionally) push the image to Docker Hub
- deploy to a hosting target
- run a health check against `/health`

### Health check endpoint

`GET /health` returns:

```json
{ "status": "ok" }
```

If the workflow fails but the app loads in the browser, update your workflow health check to:

- follow redirects (`curl -L`)
- retry (cold start delay)

Example robust health check snippet:

```bash
curl -L --retry 10 --retry-delay 3 --retry-connrefused https://YOUR_APP_URL/health
```

---

## AWS EC2 + Nginx Deployment (Step 7)

This step runs two containers on an EC2 host:

- **App container:** your project Docker image
- **nginx container:** reverse proxy exposing port 80 publicly

### Summary Table

| Component | Container                   | Purpose          | Ports             |
| --------- | --------------------------- | ---------------- | ----------------- |
| App       | `education-qualifier-app`   | Serves API + SPA | `5000` (internal) |
| Proxy     | `education-qualifier-nginx` | Public ingress   | `80:80`           |

---

### 1) Create an EC2 instance

Recommended: **Ubuntu 22.04 LTS**

Security group inbound rules:

|             Port | Protocol | Source    | Purpose   |
| ---------------: | -------- | --------- | --------- |
|               22 | TCP      | Your IP   | SSH       |
|               80 | TCP      | 0.0.0.0/0 | HTTP      |
| 443 _(optional)_ | TCP      | 0.0.0.0/0 | TLS later |

---

### 2) SSH into EC2

```bash
ssh -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP
```

---

### 3) Install Docker + Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker ubuntu
newgrp docker
```

Verify:

```bash
docker --version
docker compose version
```

---

### 4) Create deployment folder

```bash
mkdir -p ~/app/nginx
cd ~/app
```

---

### 5) Create `docker-compose.yml`

Create `~/app/docker-compose.yml` and replace `DOCKERHUB_USERNAME/education-qualifier:latest`:

```yaml
services:
  app:
    image: DOCKERHUB_USERNAME/education-qualifier:latest
    container_name: education-qualifier-app
    restart: unless-stopped
    environment:
      - PORT=5000
    expose:
      - "5000"
    networks:
      - web

  nginx:
    image: nginx:alpine
    container_name: education-qualifier-nginx
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - web

networks:
  web:
    driver: bridge
```

---

### 6) Create nginx config

Create `~/app/nginx/default.conf`:

```nginx
upstream app_upstream {
  server education-qualifier-app:5000;
}

server {
  listen 80;
  server_name _;

  location = /health {
    proxy_pass http://app_upstream/health;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /api/ {
    proxy_pass http://app_upstream/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    proxy_pass http://app_upstream/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

### 7) Pull and run

Docker Hub Link: https://hub.docker.com/r/jpadworski/credit-qualifier

```bash
docker login
```

Start:

```bash
cd ~/app
docker compose pull
docker compose up -d
```

Verify on EC2:

```bash
curl -i http://localhost/health
curl -i http://localhost/api/metadata
```

Open in browser:

- http://EC2_PUBLIC_IP/

---

## API Reference

### `GET /health`

Returns:

```json
{ "status": "ok" }
```

### `GET /api/metadata`

Returns:

```json
{
  "stage1": { "metrics": {}, "ui_metadata": {} },
  "stage2": { "metrics": {}, "ui_metadata": {} }
}
```

### `POST /api/qualify`

Payload example:

```json
{
  "loan_amount": 15000,
  "term": 36,
  "purpose": "Debt Consolidation",
  "annual_income": 95000,
  "emp_length": 10,
  "dti": 12,
  "utilization": 15,
  "delinquencies": 0,
  "fico": 780
}
```

Response example:

```json
{
  "stage1": { "...": "..." },
  "stage2": { "...": "..." },
  "explanations": {
    "drivers": ["..."],
    "suggestions": ["..."]
  },
  "disclaimer": "Educational demo. No PII collected. Not financial advice."
}
```

---

## Frontend Integration Notes

The frontend is designed to:

- avoid PII fields
- display min/max ranges per feature (from `ui_metadata.json` when wired)
- include preset applicant profiles for testing
- show disclaimers prominently
- link to the GitHub repo in the footer

In production, the backend serves the built frontend from `server/static/` so the UI and API share the same origin.

---

## Troubleshooting

### Docker build fails because frontend files are missing

If GitHub shows an arrow icon on `frontend`, it was a submodule. Convert it to a normal folder:

```bash
git rm --cached frontend
rm -rf .git/modules/frontend
rm -rf frontend/.git
git add frontend
git commit -m "Convert frontend from submodule to normal folder"
git push
```

### TypeScript build fails in Linux but works on Windows

Linux is case-sensitive. Verify your import paths match file names exactly.

Example:

```ts
import { METADATA } from "./data/creditAppData";
```

Must match actual path/casing:

- `frontend/src/data/creditAppData.ts`

### Health check fails but app loads in browser

Your workflow may be calling the wrong URL (or needs redirects/retries). Ensure:

- the health endpoint is `/health`
- your workflow uses `curl -L` and retries (cold start delays)

---

## Credits

- LendingClub public historical loan datasets (downloaded separately)
- Flask + scikit-learn + Vite/React/Tailwind + Docker + nginx
- This repository is for educational demonstration only
