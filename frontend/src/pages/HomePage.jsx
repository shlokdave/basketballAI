import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './HomePage.css';

function HomePage({ items, heading }) {
  useEffect(() => {
    fetch('http://localhost:8000/test-db')
      .then(res => res.json())
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
              {item}
            </li>
          ))}
        </ul>

      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <header className="hero-section">
        <h1>🏀 AI-Powered Player Performance Predictor</h1>
        <p>Analyze player stats, predict outcomes, and simulate game scenarios — all in real time.</p>

        <Link to="/analyze">
          <button className="cta-button">
            Start Player Analysis
          </button>
        </Link>

        <Link to="/compare">
          <button className="cta-button secondary">
            Compare Players
          </button>
        </Link>
      </header>


      <section className="favorites-section">
        <ListGroup items={items} heading="Favorite Teams" />
      </section>
    </div>
  );
}

export default HomePage;
