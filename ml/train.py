import pandas as pd
import numpy as np
import gc
import time
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# ----------------------------------------------------------------------
# Step 1: Load the dataset (the "photo album" of labeled network flows)
# ----------------------------------------------------------------------
print("Loading data... this takes a moment, the file is big.")
df = pd.read_csv("ml/data/combinenew.csv", low_memory=False)

# Step 2: Strip the leading/trailing spaces from every column name
df.columns = df.columns.str.strip()

print("Shape (rows, columns):", df.shape)

# ----------------------------------------------------------------------
# Step 3: Convert the text label into binary  (0 = BENIGN, 1 = ATTACK)
# ----------------------------------------------------------------------
df["Label"] = df["Label"].apply(lambda x: 0 if x == "BENIGN" else 1)
print("Label counts (0=benign, 1=attack):")
print(df["Label"].value_counts())

# ----------------------------------------------------------------------
# Step 4: Clean bad values (NaN and Infinity)
# Models need finite numbers; some rate columns produce Inf when a flow
# lasted ~0 seconds. Turn Inf into NaN, then drop the bad rows.
# ----------------------------------------------------------------------
df = df.replace([np.inf, -np.inf], np.nan)
rows_before = len(df)
df = df.dropna()
print(f"Dropped {rows_before - len(df)} bad rows. Clean rows: {len(df)}")

# ----------------------------------------------------------------------
# Step 5: Sample down to 200k rows to fit in limited RAM,
# keeping the 80/20 benign/attack ratio (sample each group equally).
# Sample BEFORE splitting X/y so the Label column stays intact.
# ----------------------------------------------------------------------
SAMPLE_SIZE = 200000
df_sample = df.groupby("Label", group_keys=False).sample(
    frac=SAMPLE_SIZE / len(df),
    random_state=42
)
print("Sampled dataset size:", df_sample.shape)

# ----------------------------------------------------------------------
# Step 6: Separate features (X = the 78 details) from label (y = answer)
# ----------------------------------------------------------------------
X = df_sample.drop("Label", axis=1)
y = df_sample["Label"]

# Free the big objects from memory before the heavy training step
del df, df_sample
gc.collect()

# ----------------------------------------------------------------------
# Step 7: Train/test split
#   test_size=0.3  -> 30% held out for honest testing
#   stratify=y     -> keep the 80/20 ratio in both piles
#   random_state=42-> same split every run (reproducible)
# ----------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, stratify=y, random_state=42
)
print("Training set size:", X_train.shape)
print("Test set size:", X_test.shape)

# ----------------------------------------------------------------------
# Step 8: Train the Random Forest (hundreds of voting decision trees)
#   n_estimators=100 -> 100 trees
#   n_jobs=2         -> use 2 cores (limited RAM, don't use all)
#   random_state=42  -> reproducible
# ----------------------------------------------------------------------
print("Training the Random Forest... this will take a minute or two.")
start = time.time()

model = RandomForestClassifier(
    n_estimators=100,
    n_jobs=2,
    random_state=42
)
model.fit(X_train, y_train)

print(f"Training finished in {round(time.time() - start, 1)} seconds.")

from sklearn.metrics import classification_report, confusion_matrix

# ----------------------------------------------------------------------
# Step 9: Test the model on the held-out 30% it has NEVER seen
# ----------------------------------------------------------------------
print("\nTesting on held-out data...")
y_pred = model.predict(X_test)

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["BENIGN", "ATTACK"]))

import joblib

# ----------------------------------------------------------------------
# Step 10: Save the trained model to disk so the backend can load it
# later WITHOUT retraining. We also save the exact column order, because
# at prediction time the input must have the same 78 features in the
# same order the model was trained on.
# ----------------------------------------------------------------------
joblib.dump(model, "ml/models/netguard_model.joblib")
joblib.dump(list(X.columns), "ml/models/feature_columns.joblib")
print("\nModel saved to ml/models/netguard_model.joblib")