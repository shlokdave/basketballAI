import React, { useEffect, useState } from 'react';
import './ComparePlayers.css';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function ComparePlayers() {
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [comparison, setComparison] = useState(null);
    const [playerList, setPlayerList] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/players')
            .then(res => res.json())
            .then(data => setPlayerList(data.map(p => p.full_name)));
    }, []);

    const handleCompare = async () => {
        const response = await fetch(`http://localhost:8000/compare?player1=${player1}&player2=${player2}`);
        const data = await response.json();
        setComparison(data);
    };

    return (
        <div className="compare-container">
            <h1>🆚 Compare Two NBA Players</h1>
            <div className="inputs">
                <input list="players" placeholder="Player 1" value={player1} onChange={e => setPlayer1(e.target.value)} />
                <input list="players" placeholder="Player 2" value={player2} onChange={e => setPlayer2(e.target.value)} />
                <datalist id="players">
                    {playerList.map((name, idx) => <option key={idx} value={name} />)}
                </datalist>
                <button onClick={handleCompare}>Compare</button>
            </div>

            {comparison && comparison.player1 && comparison.player2 && (
                <div className="bar-chart-container">
                    <h3>📊 Stat Comparison: {comparison.player1.name} vs {comparison.player2.name}</h3>
                    <p>This chart compares each player's per-game averages across key performance categories.</p>
                    <Bar
                        data={{
                            labels: ['Points', 'Assists', 'Rebounds', 'Steals', 'Blocks'],
                            datasets: [
                                {
                                    label: comparison.player1.name,
                                    data: [
                                        comparison.player1.stats.pts,
                                        comparison.player1.stats.ast,
                                        comparison.player1.stats.reb,
                                        comparison.player1.stats.stl,
                                        comparison.player1.stats.blk
                                    ],
                                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                                },
                                {
                                    label: comparison.player2.name,
                                    data: [
                                        comparison.player2.stats.pts,
                                        comparison.player2.stats.ast,
                                        comparison.player2.stats.reb,
                                        comparison.player2.stats.stl,
                                        comparison.player2.stats.blk
                                    ],
                                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                }
                            ]
                        }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top'
                                },
                                title: {
                                    display: true,
                                    text: 'Player Stat Comparison (Per Game)',
                                    font: {
                                        size: 18
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default ComparePlayers;
