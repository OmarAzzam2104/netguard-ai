import pandas as pd
import numpy as np
import requests

# Where our running API lives
API_URL = "http://127.0.0.1:8000/predict"

# Load and clean the dataset the same way train.py did
print("Loading dataset...")
df = pd.read_csv("ml/data/combinenew.csv", low_memory=False)
df.columns = df.columns.str.strip()
df = df.replace([np.inf, -np.inf], np.nan).dropna()

# Take a mix: 100 attack rows and 100 benign rows
attacks = df[df["Label"] != "BENIGN"].sample(n=100, random_state=1)
benign = df[df["Label"] == "BENIGN"].sample(n=100, random_state=1)
sample = pd.concat([attacks, benign]).sample(frac=1, random_state=1)  # shuffle

print(f"Sending {len(sample)} flows to the API...")

sent = 0
for _, row in sample.iterrows():
    features = row.drop("Label").tolist()          # drop the answer, keep 78 features
    features = [float(x) for x in features]         # ensure plain floats
    response = requests.post(API_URL, json={"features": features})
    if response.status_code == 200:
        sent += 1

print(f"Done. Successfully sent {sent} flows.")