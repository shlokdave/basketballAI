# train_model.py
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import os
from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
import time

# Step 1: Pick key NBA players
player_names = [
    "LeBron James", "Stephen Curry", "Kevin Durant", "Nikola Jokic",
    "Luka Doncic", "Jayson Tatum", "Joel Embiid", "Giannis Antetokounmpo",
    "Damian Lillard", "Jimmy Butler", "Kyrie Irving", "Anthony Davis",
    "Devin Booker", "Shai Gilgeous-Alexander", "Trae Young"
]

data = []

# Step 2: Pull recent season stats
for name in player_names:
    match = players.find_players_by_full_name(name)
    if not match:
        continue

    player_id = match[0]['id']
    stats = playercareerstats.PlayerCareerStats(player_id=player_id)
    time.sleep(0.6)  # Avoid hitting rate limits
    df = stats.get_data_frames()[0]
    latest = df.iloc[-1]  # Most recent season

    # Extract features for training
    row = {
        "player": name,
        "pts": latest["PTS"] / latest["GP"],
        "ast": latest["AST"] / latest["GP"],
        "reb": latest["REB"] / latest["GP"],
        "stl": latest["STL"] / latest["GP"],
        "blk": latest["BLK"] / latest["GP"],
        "target_points": latest["PTS"] / latest["GP"]  # can change to fantasy formula if desired
    }
    data.append(row)

# Step 3: Create DataFrame and train model
df = pd.DataFrame(data)
X = df[["pts", "ast", "reb", "stl", "blk"]]
y = df["target_points"]

model = LinearRegression()
model.fit(X, y)

# Step 4: Save model
os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/ai_model.pkl")

print("✅ Model trained and saved successfully!")
print(df.head())
