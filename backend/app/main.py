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
    # Step 1: Search for the player
    matched_players = players.find_players_by_full_name(player)
    if not matched_players:
        return {"error": f"No NBA player found matching '{player}'."}
    
    player_id = matched_players[0]['id']
    
    # Step 2: Fetch player's career stats
    try:
        stats = playercareerstats.PlayerCareerStats(player_id=player_id)
        time.sleep(0.5)  # Allow API to fully respond
        df = stats.get_data_frames()[0]
    except Exception as e:
        return {"error": f"Could not retrieve stats: {e}"}
    
    # Step 3: Get most recent season
    latest_season = df.iloc[-1]
    
    # Step 4: Extract features for prediction
    games_played = latest_season["GP"]
    features = {
        "pts": latest_season["PTS"] / games_played,
        "ast": latest_season["AST"] / games_played,
        "reb": latest_season["REB"] / games_played,
        "stl": latest_season["STL"] / games_played,
        "blk": latest_season["BLK"] / games_played
}


    
    df_features = pd.DataFrame([features])

    # Step 5: Run prediction
    try:
        prediction = model.predict(df_features)[0]
    except Exception as e:
        return {"error": f"Model prediction failed: {e}"}
    
    return {
        "player": player,
        "predicted_score": float(round(prediction, 2)),
        "season": str(latest_season["SEASON_ID"]),
        "based_on": {key: float(value) for key, value in features.items()}
    }

@app.get("/players")
def get_players():
    nba_players = players.get_active_players()
    return [{"full_name": p["full_name"], "id": p["id"]} for p in nba_players]

from sklearn.preprocessing import MinMaxScaler

@app.get("/compare")
def compare_players(player1: str, player2: str):
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

    # Predict scores
    df1 = pd.DataFrame([p1_data["features"]])
    df2 = pd.DataFrame([p2_data["features"]])
    try:
        score1 = float(round(model.predict(df1)[0], 2))
        score2 = float(round(model.predict(df2)[0], 2))
    except Exception as e:
        return {"error": f"Model prediction failed: {e}"}

    # Normalize stats for radar chart
    scaler = MinMaxScaler()
    combined = pd.DataFrame([p1_data["features"], p2_data["features"]])
    scaled = scaler.fit_transform(combined)
    
    radar_data = {
        "labels": list(p1_data["features"].keys()),
        "datasets": [
            {
                "label": p1_data["name"],
                "data": list(scaled[0])
            },
            {
                "label": p2_data["name"],
                "data": list(scaled[1])
            }
        ]
    }

    return {
        "player1": {"name": player1, "score": score1, "stats": p1_data["features"]},
        "player2": {"name": player2, "score": score2, "stats": p2_data["features"]},
        "radar": radar_data
    }

