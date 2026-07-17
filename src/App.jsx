import { useEffect, useMemo, useState } from 'react';

const cardValues = ['⚡', '🌙', '💧', '🔥', '🍃', '✨', '🎵', '🚀'];
const totalLevels = 15;
const difficultySettings = {
  Easy: { seconds: 500, penalty: 0 },
  Medium: { seconds: 500, penalty: 5 },
  Hard: { seconds: 500, penalty: 10 }
};

function getLevelConfig(difficulty, level) {
  if (difficulty === 'Easy') {
    return { pairs: 4 };
  }

  return { pairs: 8 };
}

function buildDeck(difficulty, level) {
  const { pairs } = getLevelConfig(difficulty, level);
  const values = cardValues.slice(0, pairs);
  const deck = [...values, ...values].map((value, index) => ({
    id: index + 1,
    value,
    matched: false,
    flipped: false
  }));

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function App() {
  const [view, setView] = useState('dashboard');
  const [deck, setDeck] = useState(buildDeck('Easy', 1));
  const [difficulty, setDifficulty] = useState('Easy');
  const [level, setLevel] = useState(1);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(difficultySettings[difficulty].seconds);
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState(false);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState('');

  const score = useMemo(() => {
    const base = 1000;
    const timeBonus = Math.max(0, seconds * 8);
    const movePenalty = moves * difficultySettings[difficulty].penalty;
    return Math.max(0, base + timeBonus - movePenalty);
  }, [moves, seconds, difficulty]);

  useEffect(() => {
    fetch('/api/scores/leaderboard')
      .then((res) => res.json())
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => setLeaderboard([]));
    fetch('/api/scores/history')
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, [winner]);

  useEffect(() => {
    if (running && seconds > 0) {
      const id = window.setTimeout(() => setSeconds((prev) => prev - 1), 1000);
      return () => window.clearTimeout(id);
    }
    if (running && seconds === 0) {
      setRunning(false);
      setMessage('Time is up! Restart to try again.');
    }
    return undefined;
  }, [running, seconds]);

  useEffect(() => {
    if (deck.every((card) => card.matched)) {
      setWinner(true);
      setRunning(false);
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: score, moves, seconds, difficulty })
      }).catch(() => {});
    }
  }, [deck, score, moves, seconds, difficulty]);

  const resetGame = (nextDifficulty = difficulty, nextLevel = level) => {
    setDifficulty(nextDifficulty);
    setLevel(nextLevel);
    setDeck(buildDeck(nextDifficulty, nextLevel));
    setSelected([]);
    setMoves(0);
    setSeconds(difficultySettings[nextDifficulty].seconds);
    setRunning(false);
    setWinner(false);
    setMessage('');
  };

  const handleFlip = (card) => {
    if (winner || selected.length === 2 || card.flipped || card.matched || seconds === 0) return;
    const nextDeck = deck.map((item) => (item.id === card.id ? { ...item, flipped: true } : item));
    const nextSelected = [...selected, card.id];
    setDeck(nextDeck);
    setSelected(nextSelected);
    if (!running) setRunning(true);
    if (nextSelected.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstId, secondId] = nextSelected;
      const first = nextDeck.find((item) => item.id === firstId);
      const second = nextDeck.find((item) => item.id === secondId);
      if (first.value === second.value) {
        setTimeout(() => {
          setDeck((prevDeck) => prevDeck.map((item) => (item.value === first.value ? { ...item, matched: true } : item)));
          setSelected([]);
        }, 700);
      } else {
        setTimeout(() => {
          setDeck((prevDeck) => prevDeck.map((item) => (nextSelected.includes(item.id) ? { ...item, flipped: false } : item)));
          setSelected([]);
        }, 1000);
      }
    }
  };

  const startGame = () => {
    setView('game');
    resetGame(difficulty, level);
    setRunning(true);
  };

  const handleDifficultyChange = (nextDifficulty) => {
    setDifficulty(nextDifficulty);
    setLevel(1);
    resetGame(nextDifficulty, 1);
  };

  const goToNextLevel = () => {
    const nextLevel = Math.min(level + 1, totalLevels);
    resetGame(difficulty, nextLevel);
    setView('game');
    setRunning(true);
  };

  return (
    <div className="app-shell">
      <Header onView={setView} view={view} />
      <main className="page-layout">
        {view === 'dashboard' && (
          <Dashboard
            leaderboard={leaderboard}
            history={history}
            difficulty={difficulty}
            level={level}
            onDifficultyChange={handleDifficultyChange}
            onStart={startGame}
            score={score}
            moves={moves}
            seconds={seconds}
          />
        )}
        {view === 'game' && (
          <MemoryGame
            deck={deck}
            difficulty={difficulty}
            seconds={seconds}
            moves={moves}
            score={score}
            running={running}
            winner={winner}
            onFlip={handleFlip}
            onRestart={() => resetGame(difficulty, level)}
            onBack={() => setView('dashboard')}
            onAdvance={goToNextLevel}
            level={level}
            totalLevels={totalLevels}
            message={message}
          />
        )}
      </main>
    </div>
  );
}

function Header({ onView, view }) {
  return (
    <header className="topbar">
      <div>
        <div className="brand">Memory Match</div>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => onView('dashboard')}>Dashboard</button>
          <button className={view === 'game' ? 'active' : ''} onClick={() => onView('game')}>Play</button>
        </nav>
      </div>
    </header>
  );
}

function Dashboard({ leaderboard, history, difficulty, level, onDifficultyChange, onStart, score, moves, seconds }) {
  return (
    <section className="dashboard-grid">
      <div className="card dashboard-card">
        <h2>Welcome</h2>
        <p>Choose a difficulty and start a fresh game.</p>
        <div className="status-pill">Level {level}/{totalLevels}</div>
        <div className="difficulty-row">
          {Object.keys(difficultySettings).map((levelName) => (
            <button
              key={levelName}
              className={levelName === difficulty ? 'active pill' : 'pill'}
              onClick={() => onDifficultyChange(levelName)}
            >
              {levelName}
            </button>
          ))}
        </div>
        <div className="stat-row">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Moves</span>
            <strong>{moves}</strong>
          </div>
          <div>
            <span>Timer</span>
            <strong>{seconds}s</strong>
          </div>
        </div>
        <button className="primary wide" onClick={onStart}>Start Memory Match</button>
      </div>
      <div className="card leaderboard-card">
        <h3>Leaderboard</h3>
        <ul>
          {leaderboard.map((item, index) => (
            <li key={item._id || item.id || index}>
              <span>{index + 1}. {item.user?.name || 'Player'}</span>
              <strong>{item.points}</strong>
            </li>
          ))}
          {leaderboard.length === 0 && <li className="muted">No leaderboard scores yet.</li>}
        </ul>
      </div>
      <div className="card history-card">
        <h3>Score History</h3>
        <ol>
          {history.map((item) => (
            <li key={item._id || item.id}>
              <span>{new Date(item.createdAt).toLocaleDateString()} - {item.difficulty}</span>
              <strong>{item.points} pts</strong>
            </li>
          ))}
          {history.length === 0 && <li className="muted">Play a game to save your first score.</li>}
        </ol>
      </div>
    </section>
  );
}

function MemoryGame({ deck, onFlip, difficulty, seconds, moves, score, running, winner, onRestart, onBack, onAdvance, level, totalLevels, message }) {
  return (
    <section className="game-shell">
      <div className="game-toolbar">
        <div className="status-pill">Difficulty: {difficulty}</div>
        <div className="status-pill">Level: {level}/{totalLevels}</div>
        <div className="status-pill">Time: {seconds}s</div>
        <div className="status-pill">Moves: {moves}</div>
        <div className="status-pill">Score: {score}</div>
      </div>
      <div className="board">
        {deck.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`card ${card.flipped || card.matched ? 'flipped' : ''}`}
            onClick={() => onFlip(card)}
            disabled={card.flipped || card.matched}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.value}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="action-row">
        <button className="ghost" onClick={onBack}>Back</button>
        <button className="primary" onClick={onRestart}>Restart</button>
      </div>
      {winner && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Level cleared!</h2>
            <p>Great memory work. Your score is {score}.</p>
            <button className="primary wide" onClick={level < totalLevels ? onAdvance : onRestart}>
              {level < totalLevels ? `Next level (${level + 1}/${totalLevels})` : 'Play again from level 1'}
            </button>
          </div>
        </div>
      )}
      {message && <div className="alert bottom-alert">{message}</div>}
    </section>
  );
}

export default App;
