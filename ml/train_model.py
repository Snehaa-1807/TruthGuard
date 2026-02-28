"""
TruthGuard - ML Training Pipeline v3
Features:
  - TF-IDF (unigrams + bigrams + trigrams)
  - 20 hand-crafted features covering ALL fake news styles
  - Gradient Boosting as additional model
  - Selects best by F1 on FAKE class
"""
import os, re, sys, json
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
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, f1_score
from scipy.sparse import hstack, csr_matrix

for pkg in ["punkt","stopwords","wordnet","omw-1.4","punkt_tab"]:
    nltk.download(pkg, quiet=True)

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

# ── 20 hand-crafted features ──────────────────────────────────────────────────
FAKE_KEYWORDS = [
    # Sensationalist
    "breaking","shocking","exposed","urgent","bombshell","leaked","whistleblower",
    "censored","banned","silenced","coverup","cover-up","hoax","conspiracy",
    "deep state","globalist","cabal","mainstream media","sheeple","wake up",
    "new world order","big pharma","microchip","plandemic","depopulation",
    "chemtrails","false flag","inside job","shadow government","illuminati",
    "satanic","bioweapon","suppressed","do your own research","share before",
    "god bless","patriots","terrified","panicking","must share","spread the word",
    # Calm medical fake
    "doctors warn","health alert","doctors say","experts warn","doctors claim",
    "circulating online","viral post","widely shared","spreading on social media",
    "allegedly comes from","reportedly based on","unverified","cannot be confirmed",
    "no official statement","no peer-reviewed","not been published","cannot be found",
    "home remedy","natural cure","miracle","won't tell you","out of business",
    "try this","share your results","thousands claim","reportedly cured",
    # Pseudoscience
    "colloidal silver","baking soda cure","alkaline water","essential oil cure",
    "big pharma hiding","doctors are paid","fda suppressing","pharmaceutical hiding",
]

REAL_KEYWORDS = [
    "study","research","published","journal","findings","data","analysis",
    "peer-reviewed","clinical trial","randomized","controlled","methodology",
    "participants","researchers","scientists","professor","doctor","official",
    "report","statistics","percent","average","survey","sample","cohort",
    "according to","cited","confirmed","announced","statement","evidence",
    "independent","verified","review","institution","university","department",
    "agency","committee","spokesperson","budget","forecast","projection",
    "double-blind","placebo","ethics board","replication","meta-analysis",
    "confidence interval","p-value","longitudinal","cross-sectional","funded by",
]

VAGUE_SOURCE_PATTERNS = [
    r"(allegedly|reportedly|claimed|circulating|viral|widely shared)",
    r"(no official statement|unverified|cannot be confirmed|not been published)",
    r"(anonymous|unnamed|secret source|undisclosed|cannot be named)",
    r"(some experts|many doctors|health experts say|specialists claim)",
    r"(a message circulating|a post (claims|warns|states|alleges))",
    r"(the warning allegedly|the study (cited|allegedly)|supposedly from)",
]

CITATION_PATTERNS = [
    r"(published in|according to|study in|journal of|found in)",
    r"(dr\.|prof\.|professor|researcher|scientist) [a-z]+ (said|noted|confirmed|found)",
    r"(university|institute|hospital|agency|department|bureau|committee)",
    r"(peer.reviewed|double.blind|randomized|clinical trial|ethics board)",
    r"(funded by|no conflict|independent|verified by|reviewed by)",
    r"\d+[,\d]* (participants|patients|subjects|adults|children|volunteers)",
]

def hand_features(text: str) -> list:
    if not text:
        return [0.0] * 20
    words      = text.split()
    wc         = max(len(words), 1)
    tl         = text.lower()

    # 1. ALL CAPS word ratio
    caps_ratio     = sum(1 for w in words if w.isupper() and len(w)>2) / wc
    # 2. Exclamation density
    excl_ratio     = min(text.count("!") / wc, 1.0)
    # 3. Triple !!! count
    triple_excl    = min(len(re.findall(r"!!!+", text)) / 3.0, 1.0)
    # 4. Fake keyword hits
    fake_hits      = sum(1 for k in FAKE_KEYWORDS if k in tl)
    fake_ratio     = min(fake_hits / 12.0, 1.0)
    # 5. Real keyword hits
    real_hits      = sum(1 for k in REAL_KEYWORDS if k in tl)
    real_ratio     = min(real_hits / 12.0, 1.0)
    # 6. Net fake score
    net_fake       = (fake_hits - real_hits) / max(fake_hits + real_hits, 1)
    # 7. Has statistics (real)
    has_stats      = 1.0 if re.search(r"\d+\.?\d*\s*(%|percent|million|billion|thousand)", tl) else 0.0
    # 8. Has named institution (real)
    has_institution= 1.0 if re.search(r"(university|institute|hospital|department|agency|committee|bureau|college)", tl) else 0.0
    # 9. Has citation pattern (real)
    has_citation   = 1.0 if any(re.search(p, tl) for p in CITATION_PATTERNS) else 0.0
    # 10. Has conspiracy phrases (sensationalist fake)
    has_conspire   = 1.0 if re.search(r"(deep state|new world order|globalist|cabal|illuminati|big pharma|shadow government)", tl) else 0.0
    # 11. Has urgency/CTA (sensationalist fake)
    has_urgency    = 1.0 if re.search(r"(share (this|now|before)|wake up|must (read|share|watch)|before they)", tl) else 0.0
    # 12. Has anonymous source (fake signal)
    has_anon       = 1.0 if re.search(r"(anonymous|unnamed|undisclosed|secret source|insider)", tl) else 0.0
    # 13. Has vague source (calm fake signal — KEY for banana type)
    vague_hits     = sum(1 for p in VAGUE_SOURCE_PATTERNS if re.search(p, tl))
    has_vague      = min(vague_hits / 3.0, 1.0)
    # 14. "Doctors warn/say" without named doctor (calm fake signal)
    has_generic_doc= 1.0 if re.search(r"(doctors (warn|say|claim|advise|urge|caution)|experts (warn|say|claim)|health experts)", tl) else 0.0
    # 15. Claim not linked to real study (calm fake)
    no_real_study  = 0.0 if re.search(r"(published in|clinical trial|peer.reviewed|randomized|journal of)", tl) else 1.0
    # 16. ALL CAPS char ratio
    all_caps_char  = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    # 17. Contains "circulating" / "viral post" / "spreading" (calm fake)
    has_viral      = 1.0 if re.search(r"(circulating|viral|spreading|widely shared|social media)", tl) else 0.0
    # 18. "no official statement" / "unverified" (calm fake — KEY signal)
    has_unverified = 1.0 if re.search(r"(no official|unverified|cannot be confirmed|not been published|no peer|cannot be found|no (hospital|institution|study))", tl) else 0.0
    # 19. "Home remedy" / "try this" / "thousands claim" (pseudoscience)
    has_pseudo     = 1.0 if re.search(r"(home remedy|try this|thousands claim|reportedly cured|won.t tell you|out of business|natural cure)", tl) else 0.0
    # 20. Avg word length (real articles use longer, technical words)
    avg_wl         = min((sum(len(w) for w in words) / wc) / 12.0, 1.0)

    return [
        caps_ratio, excl_ratio, triple_excl, fake_ratio, real_ratio,
        net_fake, has_stats, has_institution, has_citation, has_conspire,
        has_urgency, has_anon, has_vague, has_generic_doc, no_real_study,
        all_caps_char, has_viral, has_unverified, has_pseudo, avg_wl
    ]


def preprocess(text: str) -> str:
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"!!!+", " multiexclaim ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = word_tokenize(text)
    tokens = [lemmatizer.lemmatize(t) for t in tokens
              if t not in STOP_WORDS and len(t) > 2]
    return " ".join(tokens)


def load_dataset(path):
    if not os.path.exists(path):
        print(f"❌ Dataset not found: {path}")
        print("👉 Run: python generate_dataset.py")
        sys.exit(1)

    df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    df.columns = [c.lower().strip() for c in df.columns]

    if "title" in df.columns and "text" in df.columns:
        df["content"] = df["title"].fillna("") + " " + df["text"].fillna("")
    elif "text" in df.columns:
        df["content"] = df["text"].fillna("")
    else:
        raise ValueError("Need 'text' column")

    df["label"] = (df["label"].astype(str).str.upper().str.strip()
        .map(lambda x: "FAKE" if x in ["FAKE","0","FALSE","UNRELIABLE"]
                      else "REAL" if x in ["REAL","1","TRUE","RELIABLE"] else x))
    df = df[df["label"].isin(["FAKE","REAL"])].dropna(subset=["content"])
    df = df[df["content"].str.len() > 20].reset_index(drop=True)

    fake = (df["label"]=="FAKE").sum()
    real = (df["label"]=="REAL").sum()
    print(f"✅ Loaded {len(df)} | FAKE: {fake} | REAL: {real}")
    return df[["content","label"]]


def main():
    DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "fake_news.csv")
    MODEL_DIR    = os.path.join(os.path.dirname(__file__), "model")
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = load_dataset(DATASET_PATH)
    print("🔄 Preprocessing...")
    df["processed"] = df["content"].apply(preprocess)
    df = df[df["processed"].str.len() > 5].reset_index(drop=True)

    X_raw  = df["content"].tolist()
    X_proc = df["processed"].tolist()
    y      = df["label"].tolist()

    pairs = list(zip(X_raw, X_proc))
    pairs_tr, pairs_te, y_train, y_test = train_test_split(
        pairs, y, test_size=0.2, random_state=42, stratify=y)

    X_tr_raw = [p[0] for p in pairs_tr]; X_te_raw = [p[0] for p in pairs_te]
    X_tr_proc= [p[1] for p in pairs_tr]; X_te_proc= [p[1] for p in pairs_te]
    print(f"📊 Train: {len(X_tr_proc)} | Test: {len(X_te_proc)}")

    print("📐 Fitting TF-IDF (unigrams+bigrams+trigrams)...")
    tfidf = TfidfVectorizer(ngram_range=(1,3), max_features=60_000,
                            min_df=1, max_df=0.95, sublinear_tf=True)
    tfidf.fit(X_tr_proc)

    Xtr_tf = tfidf.transform(X_tr_proc)
    Xte_tf = tfidf.transform(X_te_proc)

    print("🔧 Extracting 20 hand-crafted features...")
    Xtr_h = csr_matrix(np.array([hand_features(t) for t in X_tr_raw]))
    Xte_h = csr_matrix(np.array([hand_features(t) for t in X_te_raw]))

    Xtr = hstack([Xtr_tf, Xtr_h])
    Xte = hstack([Xte_tf, Xte_h])

    models = {
        "Logistic Regression": (LogisticRegression(
            max_iter=1000, C=1.0, class_weight="balanced",
            solver="lbfgs", n_jobs=-1, random_state=42), False),
        "Random Forest": (RandomForestClassifier(
            n_estimators=300, class_weight="balanced",
            n_jobs=-1, random_state=42), False),
        "Naive Bayes": (MultinomialNB(alpha=0.05), True),  # tfidf-only
        "Gradient Boosting": (GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1,
            max_depth=4, random_state=42), False),
    }

    results   = {}
    best_clf  = None
    best_name = None
    best_f1   = 0.0

    print("\n📊 Training all models...")
    print("="*55)

    for name, (clf, nb) in models.items():
        print(f"\n▶ {name}...")
        if nb:
            clf.fit(Xtr_tf, y_train)
            y_pred = clf.predict(Xte_tf)
        else:
            clf.fit(Xtr, y_train)
            y_pred = clf.predict(Xte)

        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, pos_label="FAKE")
        print(classification_report(y_test, y_pred))
        print(f"   Accuracy: {acc:.4f} | F1(FAKE): {f1:.4f}")

        results[name] = {"accuracy": round(acc,4), "f1_fake": round(f1,4)}
        if f1 > best_f1:
            best_f1   = f1
            best_name = name
            best_clf  = (clf, nb)

    print(f"\n🏆 Best: {best_name} | F1(FAKE): {best_f1:.4f}")

    clf_obj, nb_flag = best_clf
    joblib.dump(clf_obj,  os.path.join(MODEL_DIR, "model.pkl"))
    joblib.dump(tfidf,    os.path.join(MODEL_DIR, "tfidf.pkl"))
    joblib.dump(nb_flag,  os.path.join(MODEL_DIR, "nb_mode.pkl"))

    with open(os.path.join(MODEL_DIR, "training_report.json"), "w") as f:
        json.dump({"best_model": best_name, "best_f1_fake": best_f1,
                   "all_results": results, "nb_mode": nb_flag}, f, indent=2)

    print(f"\n✅ Done! Saved to {MODEL_DIR}/")
    print(f"   Model    : {best_name}")
    print(f"   F1(FAKE) : {best_f1:.4f}")
    print(f"   Accuracy : {results[best_name]['accuracy']:.4f}")

if __name__ == "__main__":
    main()