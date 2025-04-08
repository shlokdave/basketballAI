# train_model.py
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
import joblib
import os
from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
import time

# Step 1: Get all active players
all_players = players.get_players()
active_players = [p for p in all_players if p["is_active"]]

data = []

# Step 2: Fetch most recent season stats
for p in active_players:
    try:
        stats = playercareerstats.PlayerCareerStats(player_id=p["id"])
        time.sleep(0.5)
        df = stats.get_data_frames()[0]
        latest = df.iloc[-1]

        gp = latest["GP"]
        if gp == 0:
            continue

        pts = latest["PTS"] / gp
        ast = latest["AST"] / gp
        reb = latest["REB"] / gp
        stl = latest["STL"] / gp
        blk = latest["BLK"] / gp

        fantasy = pts * 1 + ast * 1.5 + reb * 1.2 + stl * 3 + blk * 3

        row = {
            "player": f"{p['first_name']} {p['last_name']}",
            "pts": pts,
            "ast": ast,
            "reb": reb,
            "stl": stl,
            "blk": blk,
            "fantasy_score": fantasy
        }

        data.append(row)

    except Exception as e:
        continue

# Step 3: Train model
df = pd.DataFrame(data)
X = df[["pts", "ast", "reb", "stl", "blk"]]
y = df["fantasy_score"]

scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

model = LinearRegression()
model.fit(X_scaled, y)

# Step 4: Save model + scaler
os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/ai_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

print("✅ Trained model on", len(df), "players")
print(df.head())
