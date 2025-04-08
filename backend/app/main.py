from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import os
import pandas as pd
from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
from sklearn.preprocessing import MinMaxScaler
import time

# Load the model once when the server starts
MODEL_PATH = os.path.join("models", "ai_model.pkl")
model = joblib.load(MODEL_PATH)

app = FastAPI()

# Optional CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/predict")
def predict(player: str):
    scaler = joblib.load("models/scaler.pkl")

    # Step 1: Search for the player
    matched_players = players.find_players_by_full_name(player)
    if not matched_players:
        return {"error": f"No NBA player found matching '{player}'."}

    player_id = matched_players[0]['id']

    # Step 2: Fetch player's career stats
    try:
        stats = playercareerstats.PlayerCareerStats(player_id=player_id)
        time.sleep(0.5)
        df = stats.get_data_frames()[0]
    except Exception as e:
        return {"error": f"Could not retrieve stats: {e}"}

    # Step 3: Get most recent season
    latest_season = df.iloc[-1]

    # Step 4: Extract features
    games_played = latest_season["GP"]
    if games_played == 0:
        return {"error": "No games played in the latest season."}

    features = {
        "pts": latest_season["PTS"] / games_played,
        "ast": latest_season["AST"] / games_played,
        "reb": latest_season["REB"] / games_played,
        "stl": latest_season["STL"] / games_played,
        "blk": latest_season["BLK"] / games_played
    }

    df_features = pd.DataFrame([features])
    df_features_scaled = scaler.transform(df_features)
    prediction = model.predict(df_features_scaled)[0]

    return {
        "player": player,
        "predicted_score": float(round(prediction, 2)),
        "season": str(latest_season["SEASON_ID"]),
        "based_on": {key: float(value) for key, value in features.items()}
    }

@app.get("/players")
def get_players():
    all_players = players.get_players()
    active_players = [p for p in all_players if p.get("is_active")]
    return [{"full_name": f"{p['first_name']} {p['last_name']}", "id": p["id"]} for p in active_players]

@app.get("/compare")
def compare_players(player1: str, player2: str):
    scaler = joblib.load("models/scaler.pkl")

    def get_player_features(player_name):
        matched = players.find_players_by_full_name(player_name)
        if not matched:
            return None, f"No NBA player found matching '{player_name}'"
        player_id = matched[0]['id']
        try:
            stats = playercareerstats.PlayerCareerStats(player_id=player_id)
            time.sleep(0.5)
            df = stats.get_data_frames()[0]
            latest = df.iloc[-1]
            gp = latest["GP"]
            if gp == 0:
                return None, f"{player_name} has no games played in the latest season."
            features = {
                "pts": latest["PTS"] / gp,
                "ast": latest["AST"] / gp,
                "reb": latest["REB"] / gp,
                "stl": latest["STL"] / gp,
                "blk": latest["BLK"] / gp
            }
            return {"name": player_name, "features": features}, None
        except Exception as e:
            return None, str(e)

    p1_data, err1 = get_player_features(player1)
    p2_data, err2 = get_player_features(player2)

    if err1 or err2:
        return {"error": err1 or err2}

    df1 = pd.DataFrame([p1_data["features"]])
    df2 = pd.DataFrame([p2_data["features"]])

    df1_scaled = scaler.transform(df1)
    df2_scaled = scaler.transform(df2)

    score1 = float(round(model.predict(df1_scaled)[0], 2))
    score2 = float(round(model.predict(df2_scaled)[0], 2))

    def fantasy_score(stats):
        return (
            stats["pts"] * 1 +
            stats["reb"] * 1.2 +
            stats["ast"] * 1.5 +
            stats["stl"] * 3 +
            stats["blk"] * 3
        )

    fantasy1 = round(fantasy_score(p1_data["features"]), 2)
    fantasy2 = round(fantasy_score(p2_data["features"]), 2)

    # Normalize stats (for radar chart)
    combined = pd.DataFrame([p1_data["features"], p2_data["features"]])
    scaled = MinMaxScaler().fit_transform(combined)

    winners = {}
    for stat in p1_data["features"]:
        if p1_data["features"][stat] > p2_data["features"][stat]:
            winners[stat] = "Player 1"
        elif p1_data["features"][stat] < p2_data["features"][stat]:
            winners[stat] = "Player 2"
        else:
            winners[stat] = "Tie"

    p1_wins = sum(1 for w in winners.values() if w == "Player 1")
    p2_wins = sum(1 for w in winners.values() if w == "Player 2")
    if p1_wins > p2_wins:
        summary = f"🏆 {player1} outperforms {player2} in {p1_wins} out of 5 categories."
    elif p2_wins > p1_wins:
        summary = f"🏆 {player2} outperforms {player1} in {p2_wins} out of 5 categories."
    else:
        summary = "⚖️ Both players perform equally across the board."

    return {
        "player1": {
            "name": player1,
            "score": score1,
            "stats": p1_data["features"],
            "fantasy_points": fantasy1
        },
        "player2": {
            "name": player2,
            "score": score2,
            "stats": p2_data["features"],
            "fantasy_points": fantasy2
        },
        "category_winners": winners,
        "summary": summary,
        "radar": {
            "labels": list(p1_data["features"].keys()),
            "datasets": [
                {
                    "label": player1,
                    "data": list(scaled[0])
                },
                {
                    "label": player2,
                    "data": list(scaled[1])
                }
            ]
        }
    }
