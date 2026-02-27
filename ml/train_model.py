"""
TruthGuard - ML Training Pipeline
==================================
NLP Pipeline: Lowercasing → Tokenization → Stopword Removal → Lemmatization
Feature Extraction: TF-IDF (unigrams + bigrams)
Models: Logistic Regression, Naive Bayes, Random Forest
Selection: Best model by accuracy on held-out test set
"""

import os
import re
import sys
import json
import joblib
import numpy as np
import pandas as pd
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

# ── Download NLTK assets ──────────────────────────────────────────────────────
print("📦 Downloading NLTK assets...")
for pkg in ["punkt", "stopwords", "wordnet", "omw-1.4", "punkt_tab"]:
    nltk.download(pkg, quiet=True)

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

# ── Text Preprocessing ────────────────────────────────────────────────────────
def preprocess(text: str) -> str:
    """
    Full NLP preprocessing pipeline:
    1. Lowercase
    2. Remove URLs, special chars, numbers
    3. Tokenize
    4. Remove stopwords
    5. Lemmatize
    """
    if not isinstance(text, str):
        return ""

    # 1. Lowercase
    text = text.lower()

    # 2. Remove URLs
    text = re.sub(r"http\S+|www\S+", " ", text)

    # 3. Remove special characters and digits
    text = re.sub(r"[^a-z\s]", " ", text)

    # 4. Tokenize
    tokens = word_tokenize(text)

    # 5. Remove stopwords + short tokens + lemmatize
    tokens = [
        lemmatizer.lemmatize(t)
        for t in tokens
        if t not in STOP_WORDS and len(t) > 2
    ]

    return " ".join(tokens)


# ── Load Dataset ──────────────────────────────────────────────────────────────
def load_dataset(path: str) -> pd.DataFrame:
    """
    Expects CSV with columns: text (or title+text), label (FAKE/REAL or 0/1)
    Supports multiple common fake news dataset formats.
    """
    print(f"📂 Loading dataset from {path}...")
    df = pd.read_csv(path)

    # Normalize column names
    df.columns = [c.lower().strip() for c in df.columns]

    # Combine title + text if both exist
    if "title" in df.columns and "text" in df.columns:
        df["content"] = df["title"].fillna("") + " " + df["text"].fillna("")
    elif "text" in df.columns:
        df["content"] = df["text"].fillna("")
    elif "title" in df.columns:
        df["content"] = df["title"].fillna("")
    else:
        raise ValueError("Dataset must have 'text' or 'title' column")

    # Normalize label
    if "label" in df.columns:
        df["label"] = df["label"].astype(str).str.upper().str.strip()
        df["label"] = df["label"].map(
            lambda x: "FAKE" if x in ["FAKE", "0", "FALSE", "UNRELIABLE"]
            else "REAL" if x in ["REAL", "1", "TRUE", "RELIABLE"]
            else x
        )
    else:
        raise ValueError("Dataset must have 'label' column (FAKE/REAL or 0/1)")

    # Drop rows with missing content or unknown labels
    df = df[df["label"].isin(["FAKE", "REAL"])].dropna(subset=["content"])
    df = df[df["content"].str.len() > 20]

    print(f"✅ Loaded {len(df)} samples | FAKE: {(df['label']=='FAKE').sum()} | REAL: {(df['label']=='REAL').sum()}")
    return df[["content", "label"]]


# ── Train Models ──────────────────────────────────────────────────────────────
def train_and_evaluate(X_train, X_test, y_train, y_test, tfidf):
    """Train LR, NB, RF — return best model + all results."""

    X_train_tfidf = tfidf.transform(X_train)
    X_test_tfidf  = tfidf.transform(X_test)

    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, C=1.0, solver="lbfgs", n_jobs=-1, random_state=42
        ),
        "Naive Bayes": MultinomialNB(alpha=0.1),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=None,
            min_samples_split=2, n_jobs=-1, random_state=42
        ),
    }

    results = {}
    best_model = None
    best_name  = None
    best_acc   = 0.0

    print("\n📊 Training & Evaluating Models:")
    print("=" * 55)

    for name, clf in models.items():
        print(f"\n🔧 Training {name}...")
        clf.fit(X_train_tfidf, y_train)
        y_pred = clf.predict(X_test_tfidf)
        y_prob = clf.predict_proba(X_test_tfidf)[:, 1]

        acc     = accuracy_score(y_test, y_pred)
        roc_auc = roc_auc_score(
            LabelEncoder().fit_transform(y_test), y_prob
        )
        report  = classification_report(y_test, y_pred, output_dict=True)
        cm      = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "accuracy":  round(acc,     4),
            "roc_auc":   round(roc_auc, 4),
            "precision": round(report["weighted avg"]["precision"], 4),
            "recall":    round(report["weighted avg"]["recall"],    4),
            "f1_score":  round(report["weighted avg"]["f1-score"],  4),
            "confusion_matrix": cm,
        }

        print(f"   Accuracy : {acc:.4f}")
        print(f"   ROC-AUC  : {roc_auc:.4f}")
        print(f"   F1-Score : {report['weighted avg']['f1-score']:.4f}")

        if acc > best_acc:
            best_acc   = acc
            best_model = clf
            best_name  = name

    print(f"\n🏆 Best Model: {best_name} (Accuracy: {best_acc:.4f})")
    return best_model, best_name, results


# ── Extract Top TF-IDF Features ───────────────────────────────────────────────
def get_top_features(tfidf, model, n=20):
    """Return top features for FAKE and REAL classes."""
    try:
        feature_names = np.array(tfidf.get_feature_names_out())
        classes = model.classes_

        top_features = {}
        for i, cls in enumerate(classes):
            if hasattr(model, "coef_"):
                coef = model.coef_[0] if len(classes) == 2 else model.coef_[i]
                indices = np.argsort(coef)
            else:
                continue
            top_features[cls] = {
                "top_positive": feature_names[indices[-n:][::-1]].tolist(),
                "top_negative": feature_names[indices[:n]].tolist(),
            }
        return top_features
    except Exception:
        return {}


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "fake_news.csv")
    MODEL_DIR    = os.path.join(os.path.dirname(__file__), "model")
    os.makedirs(MODEL_DIR, exist_ok=True)

    # ── Load data
    df = load_dataset(DATASET_PATH)

    # ── Preprocess
    print("\n🔄 Preprocessing text (tokenize → stopwords → lemmatize)...")
    df["processed"] = df["content"].apply(preprocess)
    df = df[df["processed"].str.len() > 5]

    X = df["processed"]
    y = df["label"]

    # ── Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"🔀 Split → Train: {len(X_train)} | Test: {len(X_test)}")

    # ── TF-IDF Vectorizer (unigrams + bigrams, top 50k features)
    print("\n📐 Fitting TF-IDF vectorizer (unigrams + bigrams)...")
    tfidf = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=50_000,
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
    )
    tfidf.fit(X_train)
    print(f"   Vocabulary size: {len(tfidf.vocabulary_):,}")

    # ── Train & select best model
    best_model, best_name, results = train_and_evaluate(
        X_train, X_test, y_train, y_test, tfidf
    )

    # ── Save artifacts
    model_path = os.path.join(MODEL_DIR, "model.pkl")
    tfidf_path = os.path.join(MODEL_DIR, "tfidf.pkl")

    joblib.dump(best_model, model_path)
    joblib.dump(tfidf, tfidf_path)
    print(f"\n💾 Saved model  → {model_path}")
    print(f"💾 Saved TF-IDF → {tfidf_path}")

    # ── Save training report
    top_features = get_top_features(tfidf, best_model)
    report = {
        "best_model":   best_name,
        "best_accuracy": results[best_name]["accuracy"],
        "all_results":  results,
        "top_features": top_features,
        "vocab_size":   len(tfidf.vocabulary_),
        "train_samples": len(X_train),
        "test_samples":  len(X_test),
    }
    report_path = os.path.join(MODEL_DIR, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"📄 Training report → {report_path}")
    print("\n✅ Training complete!")


if __name__ == "__main__":
    main()
