import pandas as pd

print("Loading data... this takes a moment, the file is big.")
df = pd.read_csv("ml/data/combinenew.csv")

df.columns = df.columns.str.strip()

print("Shape (rows, columns):", df.shape)
print("First few labels:", df["Label"].unique()[:5])