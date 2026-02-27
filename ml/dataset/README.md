# Dataset Instructions

Place your fake news CSV file here as `fake_news.csv`.

## Supported Formats

### Format 1 — WELFake / Kaggle Fake News Dataset
```
id,title,author,text,label
0,"Article title","Author Name","Full article text...",1
```
Labels: `0` = REAL, `1` = FAKE

### Format 2 — ISOT Fake News Dataset
```
title,text,subject,date,label
"Title","Body text","News","Jan 1 2020","FAKE"
```

### Format 3 — Simple Format
```
text,label
"Article text here","FAKE"
"Another article","REAL"
```

## Recommended Datasets
- **WELFake**: https://www.kaggle.com/datasets/saurabhshahane/fake-news-classification
- **ISOT**: https://www.uvic.ca/engineering/ece/isot/datasets/fake-news/index.php
- **LIAR**: https://www.cs.ucsb.edu/~william/data/liar_dataset.zip

## After Placing the CSV
```bash
cd ml/
pip install -r requirements.txt
python train_model.py
```
This will generate `model/model.pkl` and `model/tfidf.pkl`.
