# 🛡️ NetGuard AI — Cloud-Native AI Intrusion Detection System

A full-stack, machine-learning-powered Network Intrusion Detection System (NIDS) that classifies network traffic as **benign** or **attack** in real time, exposes its predictions through a web API, and (in progress) surfaces results on a live dashboard backed by a database.

**Author:** Omar Azzam ([@OmarAzzam2104](https://github.com/OmarAzzam2104)) — Computer Science student, German Jordanian University.

---

## What is this project?

Traditional intrusion detection tools (e.g. Snort) rely on *hand-written signatures* — a human has to know an attack pattern in advance and encode it as a rule. NetGuard AI takes the machine-learning approach instead: it was **trained on ~2.8 million real, labeled network connections** and *learned* the statistical patterns that separate normal traffic from attacks, so it can flag malicious flows without a human writing an explicit rule for each one.

The model is served through a REST API, so any application can send it a network flow and receive a classification with a confidence score.

---

## Project status

This is an actively developed portfolio project, built step by step. The sections below are marked honestly so it's always clear what runs today versus what is planned.

| # | Layer | Status |
|---|-------|--------|
| 1 | Development environment (WSL2, Python, Docker, Git) | ✅ Done |
| 2 | ML model — Random Forest on CICIDS2017 | ✅ Done |
| 3 | FastAPI backend (`/predict`, `/health`) | ✅ Done |
| 4 | React dashboard + PostgreSQL persistence | 🔲 In progress |
| 5 | Frontend ↔ backend integration | 🔲 Planned |
| 6 | Docker containerization | 🔲 Planned |
| 7 | AWS deployment (EC2, S3, RDS — free tier) | 🔲 Planned |
| 8 | CI/CD with GitHub Actions + Bandit security scan | 🔲 Planned |
| 9 | Full documentation | 🔲 In progress |

---

## Tech stack

- **Machine Learning:** Python, scikit-learn (Random Forest), pandas, NumPy
- **Backend:** FastAPI, Uvicorn, Pydantic, joblib
- **Dataset:** CICIDS2017 (Canadian Institute for Cybersecurity, UNB)
- **Planned:** React, PostgreSQL, Docker, AWS (EC2 / S3 / RDS), GitHub Actions, Bandit

---

## The machine learning model (Step 2)

### Dataset

The model is trained on the **CICIDS2017** dataset, created by the Canadian Institute for Cybersecurity at the University of New Brunswick. It contains roughly 2.8 million labeled network flows, each described by **78 numeric features** (flow duration, packet counts per direction, TCP flag counts, inter-arrival times, etc.) extracted with CICFlowMeter, plus a label naming the traffic as benign or one of 14 attack types.

> **Note on the data:** the raw CSV file (~800 MB) is **not** included in this repository. The original dataset is available from the [Canadian Institute for Cybersecurity](https://www.unb.ca/cic/datasets/ids-2017.html).

### Key design decisions

**Binary classification (benign vs. attack).** CICIDS2017 is severely imbalanced — over 70% of traffic is benign, and some attack types have only a handful of examples (Heartbleed appears 11 times). Trying to learn 15 separate classes from so few examples is unreliable, so the problem was reframed as **binary**: benign (0) vs. attack (1). This turns an impossible task (learn an attack type from 11 rows) into a tractable one (learn "not benign" from ~557k attack rows), while keeping the detector robust. Multiclass classification is noted as future work.

**Handling the data's known defects.** The dataset contains missing (`NaN`) and infinite values (some per-second rate features divide by a near-zero duration). These were converted and dropped — about 0.1% of rows — after confirming the proportion was small enough that removal wouldn't bias the model.

**Training on a stratified sample.** Training on all 2.8M rows exceeded available memory on the development machine. A stratified 200k-row sample (preserving the benign/attack ratio) was used instead — a deliberate trade-off: near-identical model quality at a fraction of the memory and training time.

**Honest evaluation.** The data was split 70/30 into training and test sets. The model is evaluated **only on the held-out 30% it never saw during training**, so the reported score reflects generalization, not memorization (i.e. it guards against overfitting). Because of the class imbalance, plain *accuracy* is not used as the headline metric — a lazy model that always predicts "benign" would score ~80% while catching zero attacks. Instead, **precision, recall, and F1 on the attack class** are reported.

### Result

On the held-out test set the Random Forest achieves an **F1 score of ≈ 0.99** for attack detection. (Note: tree-based models are known to score very high on CICIDS2017; real-world traffic would be noisier, and this is a documented limitation of benchmarking on this dataset.)

---

## The backend API (Step 3)

A FastAPI service loads the trained model **once at startup** (not per request, for performance) and exposes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/`        | Basic liveness message |
| `GET`  | `/health`  | Confirms the model loaded and reports the expected feature count |
| `POST` | `/predict` | Accepts 78 flow features as JSON, returns a classification + confidence |

Incoming requests are validated against a Pydantic schema, so malformed input is rejected automatically before it reaches the model.

**Example prediction response:**

```json
{
  "prediction": "ATTACK",
  "is_attack": true,
  "confidence": 0.99
}
```

---

## Running it locally

> Requires Python 3.12+. The trained model file is included, so you do **not** need the dataset or to retrain in order to run the API.

```bash
# 1. Clone the repository
git clone git@github.com:OmarAzzam2104/netguard-ai.git
cd netguard-ai

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the API server
uvicorn backend.main:app --reload
```

Then open the interactive API docs in your browser:

```
http://127.0.0.1:8000/docs
```

From there you can try the `/predict` endpoint directly in the browser.

### Retraining the model (optional)

To retrain from scratch you need the CICIDS2017 CSV placed at `ml/data/combinenew.csv`, then:

```bash
python3 ml/train.py
```

---

## Project structure

```
netguard-ai/
├── ml/
│   ├── train.py                    # Data cleaning, training, evaluation, model saving
│   ├── models/
│   │   ├── netguard_model.joblib   # Trained Random Forest (loaded by the API)
│   │   └── feature_columns.joblib  # Feature order the model expects
│   └── data/                       # Dataset (git-ignored, not committed)
├── backend/
│   └── main.py                     # FastAPI app: /, /health, /predict
├── frontend/                       # React dashboard (in progress)
├── requirements.txt
└── README.md
```

---

## Roadmap

- [ ] Persist predictions to PostgreSQL and add aggregate statistics endpoints
- [ ] React dashboard with charts (attack vs. benign breakdown, detections over time)
- [ ] Containerize the backend and database with Docker
- [ ] Deploy to AWS free tier (EC2 + RDS + S3)
- [ ] CI/CD pipeline with GitHub Actions, including a Bandit security scan
- [ ] Multiclass classification (identify the specific attack type)

---

## Acknowledgements

- **Dataset:** Iman Sharafaldin, Arash Habibi Lashkari, and Ali A. Ghorbani, "Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization," Canadian Institute for Cybersecurity (CIC), University of New Brunswick, 2017.