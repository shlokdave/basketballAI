import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import './HomePage.css';

function HomePage({ items, heading }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/test-db')
      .then(res => res.json());
  }, []);

  function ListGroup() {
    const teamList = items || [];
    const [selectedIndex, setSelectedIndex] = useState(-1);

    return (
      <div className="list-container">
        <h2>{heading}</h2>
        {teamList.length === 0 && <p>No items found</p>}
        <ul className="list-group">
          {teamList.map((item, index) => (
            <li
              className={selectedIndex === index ? 'list-group-item active' : 'list-group-item'}
              key={item}
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={`https://nba-players.herokuapp.com/players/${item.split(' ').slice(-1)[0]}/${item.split(' ')[0]}`}
                alt={item}
                className="player-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`home-wrapper ${darkMode ? 'dark' : ''}`}>
      <button onClick={() => setDarkMode(!darkMode)} className="dark-toggle">
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      <header className="hero-section">
        <h1>🏀 AI-Powered Player Performance Predictor</h1>
        <p>Analyze player stats, predict outcomes, and simulate game scenarios — all in real time.</p>

        <div className="cta-container">
          <Link to="/analyze">
            <button className="cta-button">🚀 Start Player Analysis</button>
          </Link>
          <Link to="/compare">
            <button className="cta-button secondary">🧮 Compare Players</button>
          </Link>
        </div>
      </header>

      <div className="wave-divider">
        <svg viewBox="0 0 1440 320"><path fill="#f9f9f9" d="M0,224L80,197.3C160,171,320,117,480,122.7C640,128,800,192,960,213.3C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path></svg>
      </div>

      <section className="features-section">
        <div className="feature-card">
          <h3>📊 Predictive AI</h3>
          <p>Real-time performance forecasts using data + trends.</p>
          <Sparklines data={[5, 10, 5, 20, 8, 15]}>
            <SparklinesLine color="blue" />
          </Sparklines>
        </div>
        <div className="feature-card">
          <h3>🧠 Smart Comparison</h3>
          <p>Side-by-side player breakdowns for better picks.</p>
          <Sparklines data={[3, 6, 9, 12, 6, 9]}>
            <SparklinesLine color="green" />
          </Sparklines>
        </div>
        <div className="feature-card">
          <h3>📈 Trend Visualizer</h3>
          <p>Interactive stat visualizations for deeper insights.</p>
          <Sparklines data={[1, 3, 5, 9, 7, 12]}>
            <SparklinesLine color="purple" />
          </Sparklines>
        </div>
      </section>

      <section className="favorites-section">
        <ListGroup items={items} heading="Favorite Teams" />
      </section>
    </div>
  );
}

export default HomePage;
