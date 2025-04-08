import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import './ComparePlayers.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function ComparePlayers() {
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [comparison, setComparison] = useState(null);
    const [playerList, setPlayerList] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/players')
            .then(res => res.json())
            .then(data => {
                console.log(data); // ← add this
                setPlayerList(data.map(p => p.full_name));
            });
    }, []);


    const handleCompare = async () => {
        const response = await fetch(`http://localhost:8000/compare?player1=${player1}&player2=${player2}`);
        const data = await response.json();
        setComparison(data);
    };

    const playerOptions = playerList.map(name => ({ value: name, label: name }));

    return (
        <div className="compare-container">
            <h1>🆚 Compare Two NBA Players</h1>
            <div className="inputs">
                <Select
                    options={playerOptions}
                    placeholder="Select Player 1"
                    value={playerOptions.find(p => p.value === player1)}
                    onChange={(selected) => setPlayer1(selected.value)}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    filterOption={(option, input) => {
                        const name = option.label.toLowerCase();
                        const [first, last] = name.split(' ');
                        return (
                            first.startsWith(input.toLowerCase()) ||
                            last.startsWith(input.toLowerCase())
                        );
                    }}
                />


                <Select
                    options={playerOptions}
                    placeholder="Select Player 2"
                    value={playerOptions.find(p => p.value === player2)}
                    onChange={selected => setPlayer2(selected.value)}
                    className="react-select-container"
                    classNamePrefix="react-select"
                />

                <button onClick={handleCompare}>Compare</button>
            </div>

            {comparison && !comparison.error && (
                <>
                    <h2 style={{ marginTop: '30px' }}>{comparison.summary}</h2>

                    <div className="comparison-result">
                        {[comparison.player1, comparison.player2].map((p, i) => (
                            <div key={i} className="player-card">
                                <h2>{p.name}</h2>
                                <p><strong>Predicted Score:</strong> {p.score}</p>
                                <p><strong>Fantasy Points:</strong> {p.fantasy_points}</p>
                                <ul>
                                    {Object.entries(p.stats).map(([stat, value]) => (
                                        <li key={stat}>
                                            {stat.toUpperCase()}: {value.toFixed(2)}{' '}
                                            {comparison.category_winners[stat] === `Player ${i + 1}` && '🏆'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="bar-chart-container">
                        <h3>📊 Stat Comparison (Bar Chart)</h3>
                        <Bar
                            data={{
                                labels: Object.keys(comparison.player1.stats),
                                datasets: [
                                    {
                                        label: comparison.player1.name,
                                        data: Object.values(comparison.player1.stats),
                                        backgroundColor: 'rgba(255, 99, 132, 0.6)'
                                    },
                                    {
                                        label: comparison.player2.name,
                                        data: Object.values(comparison.player2.stats),
                                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default ComparePlayers;
