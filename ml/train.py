import pandas as pd

print("Loading data... this takes a moment, the file is big.")
df = pd.read_csv("ml/data/combinenew.csv")

df.columns = df.columns.str.strip()

print("Shape (rows, columns):", df.shape)
print("First few labels:", df["Label"].unique()[:5])

# Step 4: Convert the text label into binary 0/1
# 0 = BENIGN (normal traffic), 1 = ATTACK (anything else)
df["Label"] = df["Label"].apply(lambda x: 0 if x == "BENIGN" else 1)

# Check the result: how many of each?
print("Label counts (0=benign, 1=attack):")
print(df["Label"].value_counts())

import numpy as np

# Step 5: Investigate bad values before cleaning
# Replace any infinity values with NaN so we can count them all together
df = df.replace([np.inf, -np.inf], np.nan)

# Count how many rows have at least one missing/bad value
bad_rows = df.isnull().any(axis=1).sum()
print("Rows with at least one bad (NaN or Inf) value:", bad_rows)
print("That's", round(bad_rows / len(df) * 100, 4), "% of the data")

# Step 6: Drop the bad rows now that we know they're a tiny fraction
rows_before = len(df)
df = df.dropna()
rows_after = len(df)
print(f"Dropped {rows_before - rows_after} bad rows.")
print(f"Clean dataset now has {rows_after} rows.")