import React, { useState, useEffect } from 'react';
import './AnalyzePage.css';

function AnalyzePage() {
    const [playerName, setPlayerName] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [playerList, setPlayerList] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/players')
            .then(res => res.json())
            .then(data => setPlayerList(data.map(p => p.full_name)))
            .catch(err => console.error("Error fetching players:", err));
    }, []);

    const handlePredict = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/predict?player=${playerName}`);
            const data = await response.json();
            setPrediction(data);
        } catch (error) {
            console.error("Prediction failed:", error);
            setPrediction(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="analyze-container">
            <h1>🔍 Player Performance Prediction</h1>
            <input
                list="player-options"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name (e.g., Steph Curry)"
            />
            <datalist id="player-options">
                {playerList.map((player, index) => (
                    <option key={index} value={player} />
                ))}
            </datalist>

            <button onClick={handlePredict}>Predict</button>

            {loading && <p>Loading prediction...</p>}

            {prediction && (
                <div className="prediction-card">
                    <h3>Predicted Score for {prediction.player}</h3>
                    <ul>
                        <li>Points Input: {prediction.based_on.pts}</li>
                        <li>Assists Input: {prediction.based_on.ast}</li>
                        <li>Rebounds Input: {prediction.based_on.reb}</li>
                        <li>Steals Input: {prediction.based_on.stl}</li>
                        <li>Blocks Input: {prediction.based_on.blk}</li>
                        <li><strong>Predicted Score: {prediction.predicted_score}</strong></li>
                        <li>Season: {prediction.season}</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default AnalyzePage;
