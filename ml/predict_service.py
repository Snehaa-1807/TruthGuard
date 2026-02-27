"""
TruthGuard - Python Prediction Microservice (Flask)
====================================================
Exposes: POST /predict
Called by Node.js backend via HTTP
"""

import os
import re
import json
import joblib
import numpy as np
import nltk
from flask import Flask, request, jsonify
from flask_cors import CORS
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from dotenv import load_dotenv

load_dotenv()

# ── Download NLTK assets (on first run) ──────────────────────────────────────
for pkg in ["punkt", "stopwords", "wordnet", "omw-1.4", "punkt_tab"]:
    nltk.download(pkg, quiet=True)

STOP_WORDS  = set(stopwords.words("english"))
lemmatizer  = WordNetLemmatizer()

# ── Load model + vectorizer ───────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
TFIDF_PATH = os.path.join(BASE_DIR, "model", "tfidf.pkl")

model = None
tfidf = None

def load_artifacts():
    global model, tfidf
    if not os.path.exists(MODEL_PATH) or not os.path.exists(TFIDF_PATH):
        print("⚠️  Model files not found. Run train_model.py first.")
        return False
    model = joblib.load(MODEL_PATH)
    tfidf = joblib.load(TFIDF_PATH)
    print("✅ Model and TF-IDF loaded successfully")
    return True

# ── NLP Preprocessing ─────────────────────────────────────────────────────────
def preprocess(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text   = text.lower()
    text   = re.sub(r"http\S+|www\S+", " ", text)
    text   = re.sub(r"[^a-z\s]", " ", text)
    tokens = word_tokenize(text)
    tokens = [
        lemmatizer.lemmatize(t)
        for t in tokens
        if t not in STOP_WORDS and len(t) > 2
    ]
    return " ".join(tokens)


# ── Suspicious Keyword Extraction ────────────────────────────────────────────
SUSPICIOUS_PATTERNS = [
    r"\b(breaking|urgent|alert|shocking|explosive|bombshell)\b",
    r"\b(secret|hidden|exposed|reveal|leaked|whistleblower)\b",
    r"\b(elite|cabal|deep state|globalist|puppet|controlled)\b",
    r"\b(100%|proven|guaranteed|undeniable|absolute truth)\b",
    r"\b(mainstream media|fake news|lamestream|msm|propaganda)\b",
    r"\b(conspiracy|hoax|false flag|cover.?up|plandemic)\b",
    r"\b(miracle|cure all|destroy|obliterate|annihilate)\b",
    r"\b(wake up|sheeple|they don.t want you|open your eyes)\b",
]

def extract_suspicious_keywords(text: str):
    found = set()
    for pat in SUSPICIOUS_PATTERNS:
        matches = re.findall(pat, text, flags=re.IGNORECASE)
        found.update(m.lower() for m in matches)
    return list(found)[:12]


# ── Get top TF-IDF word importance for this prediction ────────────────────────
def get_word_importance(processed_text: str, top_n: int = 10):
    """Returns most important words for this specific prediction."""
    try:
        vec   = tfidf.transform([processed_text])
        names = np.array(tfidf.get_feature_names_out())

        if hasattr(model, "coef_"):
            coef   = model.coef_[0]
            scores = vec.toarray()[0] * coef
        else:
            scores = vec.toarray()[0]

        top_idx = np.argsort(np.abs(scores))[-top_n:][::-1]
        return [
            {"word": names[i], "score": round(float(scores[i]), 4)}
            for i in top_idx if scores[i] != 0
        ]
    except Exception:
        return []


# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=os.getenv("ALLOWED_ORIGIN", "http://localhost:5000"))

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "service": "TruthGuard ML Service"
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    if len(text) < 20:
        return jsonify({"error": "Text too short (min 20 chars)"}), 400
    if len(text) > 50_000:
        text = text[:50_000]

    if model is None or tfidf is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    # Preprocess
    processed = preprocess(text)

    # TF-IDF transform
    vec = tfidf.transform([processed])

    # Predict
    label      = model.predict(vec)[0]            # "FAKE" or "REAL"
    proba      = model.predict_proba(vec)[0]      # [prob_class0, prob_class1]
    classes    = model.classes_                    # e.g. ["FAKE", "REAL"]

    label_idx  = list(classes).index(label)
    confidence = float(proba[label_idx])

    # Word importance
    word_importance = get_word_importance(processed)

    # Suspicious keywords from raw text
    suspicious_keywords = extract_suspicious_keywords(text)

    return jsonify({
        "verdict":             label,
        "confidence":          round(confidence, 4),
        "probabilities": {
            cls: round(float(p), 4)
            for cls, p in zip(classes, proba)
        },
        "word_importance":     word_importance,
        "suspicious_keywords": suspicious_keywords,
        "processed_length":    len(processed.split()),
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    """Return metadata about loaded model."""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    report_path = os.path.join(BASE_DIR, "model", "training_report.json")
    if os.path.exists(report_path):
        with open(report_path) as f:
            report = json.load(f)
        return jsonify(report)

    return jsonify({
        "model_type": type(model).__name__,
        "classes": model.classes_.tolist() if hasattr(model, "classes_") else [],
    })


if __name__ == "__main__":
    load_artifacts()
    port = int(os.getenv("ML_PORT", 5001))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    print(f"🚀 TruthGuard ML Service running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
