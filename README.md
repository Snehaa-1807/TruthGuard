# 🛡 TruthGuard — AI-Powered Fake News Detection Platform

A full-stack misinformation detection system using NLP, TF-IDF, and machine learning.

## Architecture

```
TruthGuard/
├── ml/          → Python Flask microservice (NLP + scikit-learn)
├── server/      → Node.js Express REST API (JWT auth + MongoDB)
└── client/      → React + Vite frontend
```

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend  | Node.js, Express, MongoDB, Mongoose, JWT |
| ML       | Python, Flask, scikit-learn, NLTK, TF-IDF |
| Auth     | bcryptjs, JSON Web Tokens |

---

## Quick Start

### 1. ML Service

```bash
cd ml/
pip install -r requirements.txt

# Place fake_news.csv in ml/dataset/ (see dataset/README.md)
python train_model.py           # Train and save model.pkl + tfidf.pkl

cp .env.example .env
python predict_service.py       # Start Flask on :5001
```

### 2. Node.js Backend

```bash
cd server/
npm install

cp .env.example .env
# Edit .env → set MONGO_URI and JWT_SECRET

npm run dev                     # Start Express on :5000
```

### 3. React Frontend

```bash
cd client/
npm install

cp .env.example .env            # VITE_API_URL=http://localhost:5000/api
npm run dev                     # Start Vite on :3000
```

Open **http://localhost:3000**

---

## ML Pipeline

```
Raw text
   ↓ Lowercase
   ↓ Remove URLs, special chars
   ↓ Tokenize (NLTK punkt)
   ↓ Remove stopwords (NLTK english)
   ↓ Lemmatize (WordNetLemmatizer)
   ↓ TF-IDF Vectorize (unigrams + bigrams, max 50k features)
   ↓
   ├── Logistic Regression
   ├── Naive Bayes (MultinomialNB)
   └── Random Forest (200 trees)
       ↓
    Best model by accuracy → saved as model.pkl
```

## REST API

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET  | `/api/auth/me` | Get current user |

### Predict
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Analyze article text |
| GET  | `/api/predict/model-info` | Model metadata |

### History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/history` | Paginated history |
| GET    | `/api/history/stats` | Analytics |
| GET    | `/api/history/:id` | Full result |
| DELETE | `/api/history/:id` | Delete one |
| DELETE | `/api/history` | Clear all |

### Example POST /api/predict
```json
// Request
{ "text": "SHOCKING: Scientists EXPOSE massive conspiracy..." }

// Response
{
  "historyId": "65f...",
  "verdict": "FAKE",
  "confidence": 0.87,
  "probabilities": { "FAKE": 0.87, "REAL": 0.13 },
  "suspiciousKeywords": ["shocking", "expose", "conspiracy"],
  "wordImportance": [{ "word": "shocking", "score": 0.42 }]
}
```

## Environment Variables

### server/.env
```
MONGO_URI=mongodb://localhost:27017/truthguard
JWT_SECRET=your_32+_char_secret_here
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:5001
```

### ml/.env
```
ML_PORT=5001
FLASK_ENV=development
ALLOWED_ORIGIN=http://localhost:5000
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
```

## Datasets

Recommended:
- **WELFake** (72k articles): https://www.kaggle.com/datasets/saurabhshahane/fake-news-classification
- **ISOT** (44k articles): https://www.uvic.ca/engineering/ece/isot/datasets/

Place as `ml/dataset/fake_news.csv` with columns: `text`, `label` (FAKE/REAL)

## Security Features
- Passwords hashed with bcryptjs (salt rounds: 12)
- JWT tokens with configurable expiry
- Rate limiting (100 req/15min global, 10 req/min on predict)
- Helmet.js security headers
- Input validation with express-validator
- CORS restricted to client URL
- Password field excluded from all DB queries by default
