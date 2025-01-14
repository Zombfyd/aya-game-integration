import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@suiet/wallet-kit';

// WalletManager component to handle wallet connection
const WalletManager = ({ onGameStart }) => {
  const wallet = useWallet();
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle wallet connection changes
  useEffect(() => {
    if (wallet.connected) {
      window.currentWalletAddress = wallet.account?.address;
    } else {
      window.currentWalletAddress = null;
    }
  }, [wallet.connected]);

  const handleConnectDisconnect = async () => {
    setIsProcessing(true);
    try {
      if (wallet.connected) {
        await wallet.disconnect();
      } else {
        await wallet.connect();
      }
    } catch (error) {
      setStatus('Error during connection');
      console.error('Wallet Connection Error:', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="wallet-container">
      <button 
        onClick={handleConnectDisconnect} 
        className="wallet-button"
        disabled={isProcessing}
      >
        {isProcessing 
          ? 'Connecting...' 
          : wallet.connected 
            ? `${wallet.account?.address.slice(0, 6)}...${wallet.account?.address.slice(-4)}` 
            : 'Connect Wallet'
        }
      </button>
      {status && <div className="status-message">{status}</div>}
    </div>
  );
};

// Main GameApp component
const GameApp = () => {
  const wallet = useWallet(); // Access wallet via hook
  const [gameState, setGameState] = useState({
    gameStarted: false,
    score: 0,
    isGameOver: false
  });
  const [leaderboardData, setLeaderboardData] = useState({
    main: [],
    secondary: []
  });

  // Effect to initialize game components
  useEffect(() => {
    // Initialize game canvas and other resources
    const canvas = document.getElementById('tearCatchGameCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentNode.offsetWidth;
      canvas.height = canvas.parentNode.offsetHeight;
    }

    // Fetch initial leaderboard data
    fetchLeaderboards();
  }, []);

  // Function to fetch leaderboard data
  const fetchLeaderboards = async () => {
    try {
      const [mainData, secondaryData] = await Promise.all([
        fetch('https://ayagame.onrender.com/api/scores/leaderboard/main/free').then(res => res.json()),
        fetch('https://ayagame.onrender.com/api/scores/leaderboard/secondary/free').then(res => res.json())
      ]);

      setLeaderboardData({
        main: mainData,
        secondary: secondaryData
      });
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    }
  };

  // Handle game start
  const handleGameStart = () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      score: 0,
      isGameOver: false
    }));

    // Call the game manager to start the game
    if (window.gameManager) {
      window.gameManager.startGame();
    }
  };

  // Handle score submission
  const handleScoreSubmit = async () => {
    const walletAddress = window.currentWalletAddress;
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('https://ayagame.onrender.com/api/scores/submit/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerWallet: walletAddress,
          score: gameState.score,
          gameType: 'main'
        })
      });

      if (response.ok) {
        alert('Score submitted successfully!');
        fetchLeaderboards(); // Refresh leaderboards
      } else {
        throw new Error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    }
  };

  // Render leaderboard table
  const renderLeaderboard = (data, title) => (
    <div className="leaderboard-section">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Wallet</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={index}>
              <td>{`${entry.playerWallet.slice(0, 6)}...${entry.playerWallet.slice(-4)}`}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <WalletProvider>
      <div className="game-container">
        <WalletManager onGameStart={handleGameStart} />
        
        {!gameState.gameStarted && (
          <div id="startGame" className="game-popup" style={{ display: 'block' }}>
            <h2>Ready to Play?</h2>
            <button onClick={handleGameStart}>Start Game</button>
          </div>
        )}

        <canvas id="tearCatchGameCanvas" className="game-canvas" />

        <div className="leaderboards-container">
          {renderLeaderboard(leaderboardData.main, 'Main Leaderboard')}
          {renderLeaderboard(leaderboardData.secondary, 'Secondary Leaderboard')}
        </div>

        {gameState.isGameOver && (
          <div id="scorePopup" className="score-popup" style={{ display: 'block' }}>
            <h2>Game Over!</h2>
            <p>Your Score: <span>{gameState.score}</span></p>
            <button onClick={handleScoreSubmit}>Submit Score</button>
          </div>
        )}

        {gameState.isGameOver && (
          <div id="restartGame" className="restart-popup" style={{ display: 'block' }}>
            <h2>Play Again?</h2>
            <button onClick={handleGameStart}>Restart Game</button>
          </div>
        )}
      </div>
    </WalletProvider>
  );
};

export default GameApp;
