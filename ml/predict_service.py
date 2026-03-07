"""
TruthGuard - Prediction Microservice v3
Handles ALL fake news types including calm medical misinformation.
"""
import os, re, json
import joblib
import numpy as np
import nltk
from flask import Flask, request, jsonify
from flask_cors import CORS
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from scipy.sparse import hstack, csr_matrix
from dotenv import load_dotenv

load_dotenv()

for pkg in ["punkt","stopwords","wordnet","omw-1.4","punkt_tab"]:
    nltk.download(pkg, quiet=True)

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

BASE_DIR   = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
TFIDF_PATH = os.path.join(BASE_DIR, "model", "tfidf.pkl")
NB_PATH    = os.path.join(BASE_DIR, "model", "nb_mode.pkl")

model = tfidf = None
nb_mode = False

def load_artifacts():
    global model, tfidf, nb_mode
    if not os.path.exists(MODEL_PATH):
        print("⚠️  model.pkl not found — run train_model.py first")
        return False
    model   = joblib.load(MODEL_PATH)
    tfidf   = joblib.load(TFIDF_PATH)
    nb_mode = joblib.load(NB_PATH) if os.path.exists(NB_PATH) else False
    print(f"✅ Model loaded: {type(model).__name__}, nb_mode={nb_mode}")
    return True

# ── Keyword lists (must match train_model.py exactly) ─────────────────────────
FAKE_KEYWORDS = [
    "breaking","shocking","exposed","urgent","bombshell","leaked","whistleblower",
    "censored","banned","silenced","coverup","cover-up","hoax","conspiracy",
    "deep state","globalist","cabal","mainstream media","sheeple","wake up",
    "new world order","big pharma","microchip","plandemic","depopulation",
    "chemtrails","false flag","inside job","shadow government","illuminati",
    "satanic","bioweapon","suppressed","do your own research","share before",
    "god bless","patriots","terrified","panicking","must share","spread the word",
    "doctors warn","health alert","doctors say","experts warn","doctors claim",
    "circulating online","viral post","widely shared","spreading on social media",
    "allegedly comes from","reportedly based on","unverified","cannot be confirmed",
    "no official statement","no peer-reviewed","not been published","cannot be found",
    "home remedy","natural cure","miracle","won't tell you","out of business",
    "try this","share your results","thousands claim","reportedly cured",
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
    words = text.split()
    wc    = max(len(words), 1)
    tl    = text.lower()

    caps_ratio      = sum(1 for w in words if w.isupper() and len(w)>2) / wc
    excl_ratio      = min(text.count("!") / wc, 1.0)
    triple_excl     = min(len(re.findall(r"!!!+", text)) / 3.0, 1.0)
    fake_hits       = sum(1 for k in FAKE_KEYWORDS if k in tl)
    real_hits       = sum(1 for k in REAL_KEYWORDS if k in tl)
    fake_ratio      = min(fake_hits / 12.0, 1.0)
    real_ratio      = min(real_hits / 12.0, 1.0)
    net_fake        = (fake_hits - real_hits) / max(fake_hits + real_hits, 1)
    has_stats       = 1.0 if re.search(r"\d+\.?\d*\s*(%|percent|million|billion|thousand)", tl) else 0.0
    has_institution = 1.0 if re.search(r"(university|institute|hospital|department|agency|committee|bureau|college)", tl) else 0.0
    has_citation    = 1.0 if any(re.search(p, tl) for p in CITATION_PATTERNS) else 0.0
    has_conspire    = 1.0 if re.search(r"(deep state|new world order|globalist|cabal|illuminati|big pharma|shadow government)", tl) else 0.0
    has_urgency     = 1.0 if re.search(r"(share (this|now|before)|wake up|must (read|share|watch)|before they)", tl) else 0.0
    has_anon        = 1.0 if re.search(r"(anonymous|unnamed|undisclosed|secret source|insider)", tl) else 0.0
    vague_hits      = sum(1 for p in VAGUE_SOURCE_PATTERNS if re.search(p, tl))
    has_vague       = min(vague_hits / 3.0, 1.0)
    has_generic_doc = 1.0 if re.search(r"(doctors (warn|say|claim|advise|urge|caution)|experts (warn|say|claim)|health experts)", tl) else 0.0
    no_real_study   = 0.0 if re.search(r"(published in|clinical trial|peer.reviewed|randomized|journal of)", tl) else 1.0
    all_caps_char   = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    has_viral       = 1.0 if re.search(r"(circulating|viral|spreading|widely shared|social media)", tl) else 0.0
    has_unverified  = 1.0 if re.search(r"(no official|unverified|cannot be confirmed|not been published|no peer|cannot be found|no (hospital|institution|study))", tl) else 0.0
    has_pseudo      = 1.0 if re.search(r"(home remedy|try this|thousands claim|reportedly cured|won.t tell you|out of business|natural cure)", tl) else 0.0
    avg_wl          = min((sum(len(w) for w in words) / wc) / 12.0, 1.0)

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


SUSPICIOUS_PATTERNS = [
    r"\b(breaking|urgent|alert|shocking|explosive|bombshell)\b",
    r"\b(secret|hidden|exposed|reveal|leaked|whistleblower)\b",
    r"\b(deep state|globalist|cabal|new world order|shadow government)\b",
    r"\b(mainstream media|fake news|msm|propaganda|censored)\b",
    r"\b(conspiracy|hoax|false flag|cover.?up|plandemic)\b",
    r"\b(miracle cure|suppressed|big pharma|depopulation)\b",
    r"\b(wake up|sheeple|do your own research|share before|must share)\b",
    r"\b(allegedly|reportedly|circulating online|viral post|widely shared)\b",
    r"\b(no official statement|unverified|cannot be confirmed)\b",
    r"\b(doctors warn|experts warn|health alert)\b",
    r"!!!+",
]

def get_suspicious(text):
    found = set()
    for pat in SUSPICIOUS_PATTERNS:
        for m in re.findall(pat, text, flags=re.IGNORECASE):
            if isinstance(m, tuple): m = m[0]
            found.add(m.strip().lower())
    return [x for x in list(found) if x][:12]


def get_word_importance(processed, top_n=10):
    try:
        vec   = tfidf.transform([processed])
        names = np.array(tfidf.get_feature_names_out())
        if hasattr(model, "coef_"):
            scores = vec.toarray()[0] * model.coef_[0]
            idx    = np.argsort(np.abs(scores))[-top_n:][::-1]
            return [{"word": names[i], "score": round(float(scores[i]),4)}
                    for i in idx if scores[i] != 0]
    except Exception:
        pass
    return []


def rule_score(text: str):
    """
    Returns a fake_score between 0.0 and 1.0 based purely on rules.
    This is combined with ML probability — not used as a hard override.
    """
    tl    = text.lower()
    feats = hand_features(text)

    caps_ratio      = feats[0]
    excl_ratio      = feats[1]
    triple_excl     = feats[2]
    fake_ratio      = feats[3]
    real_ratio      = feats[4]
    has_stats       = feats[6]
    has_institution = feats[7]
    has_citation    = feats[8]
    has_conspire    = feats[9]
    has_urgency     = feats[10]
    has_anon        = feats[11]
    has_vague       = feats[12]
    has_generic_doc = feats[13]
    no_real_study   = feats[14]
    has_viral       = feats[16]
    has_unverified  = feats[17]
    has_pseudo      = feats[18]

    # Build fake evidence score
    fake_evidence = (
        caps_ratio      * 0.08 +
        triple_excl     * 0.10 +
        fake_ratio      * 0.15 +
        has_conspire    * 0.10 +
        has_urgency     * 0.08 +
        has_anon        * 0.08 +
        has_vague       * 0.12 +   # KEY: "allegedly", "circulating"
        has_generic_doc * 0.08 +   # KEY: "doctors warn" without name
        no_real_study   * 0.06 +   # KEY: no journal/trial mentioned
        has_viral       * 0.07 +   # KEY: "viral post", "widely shared"
        has_unverified  * 0.10 +   # KEY: "no official statement"
        has_pseudo      * 0.08
    )

    # Build real evidence score
    real_evidence = (
        real_ratio      * 0.25 +
        has_stats       * 0.20 +
        has_institution * 0.20 +
        has_citation    * 0.25 +
        (1 - no_real_study) * 0.10
    )

    # Net fake score (0 = definitely real, 1 = definitely fake)
    net = fake_evidence - (real_evidence * 0.6)
    return max(0.0, min(1.0, 0.5 + net))


# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins="*")

# Load model at startup — works for both `python predict_service.py` and gunicorn
load_artifacts()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status":"ok","model_loaded": model is not None})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    if len(text) < 20:
        return jsonify({"error": "Text too short (min 20 chars)"}), 400
    text = text[:50_000]

    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    processed = preprocess(text)

    # ── ML prediction ──────────────────────────────────────────────────────────
    tfidf_vec = tfidf.transform([processed])
    if nb_mode:
        ml_proba = model.predict_proba(tfidf_vec)[0]
    else:
        hand_vec = csr_matrix(np.array([hand_features(text)]))
        combined = hstack([tfidf_vec, hand_vec])
        ml_proba = model.predict_proba(combined)[0]

    classes  = list(model.classes_)
    fake_idx = classes.index("FAKE") if "FAKE" in classes else 0
    real_idx = classes.index("REAL") if "REAL" in classes else 1

    ml_fake_prob = float(ml_proba[fake_idx])
    ml_real_prob = float(ml_proba[real_idx])

    # ── Rule score ─────────────────────────────────────────────────────────────
    rs = rule_score(text)  # 0.0 = real, 1.0 = fake

    # ── Blend ML + rules (60% ML, 40% rules) ──────────────────────────────────
    blended_fake = (ml_fake_prob * 0.60) + (rs * 0.40)
    blended_real = 1.0 - blended_fake

    # Threshold: 0.45 (slightly below 0.5 — prefer catching fake)
    label = "FAKE" if blended_fake >= 0.45 else "REAL"
    confidence = blended_fake if label == "FAKE" else blended_real
    confidence = round(min(confidence, 0.99), 4)

    return jsonify({
        "verdict":             label,
        "confidence":          confidence,
        "probabilities": {
            "FAKE": round(blended_fake, 4),
            "REAL": round(blended_real, 4),
        },
        "ml_probabilities": {
            "FAKE": round(ml_fake_prob, 4),
            "REAL": round(ml_real_prob, 4),
        },
        "rule_score":          round(rs, 4),
        "word_importance":     get_word_importance(processed),
        "suspicious_keywords": get_suspicious(text),
        "processed_length":    len(processed.split()),
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503
    path = os.path.join(BASE_DIR, "model", "training_report.json")
    if os.path.exists(path):
        with open(path) as f:
            return jsonify(json.load(f))
    return jsonify({"model_type": type(model).__name__})


if __name__ == "__main__":
    load_artifacts()
    port = int(os.getenv("ML_PORT", 5001))
    print(f"🚀 TruthGuard ML Service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)