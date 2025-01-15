import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet, SuiChainId, useSuiClient, ConnectButton } from '@suiet/wallet-kit';
import { formatSUI } from '@suiet/wallet-kit';
import './App.css';

// Main GameApp component
const GameApp = () => {
  const wallet = useWallet(); // Access wallet via hook
  const client = useSuiClient();  // Client to interact with Sui
  const [gameState, setGameState] = useState({
    gameStarted: false,
    score: 0,
    isGameOver: false
  });
  const [leaderboardData, setLeaderboardData] = useState({
    main: [],
    secondary: []
  });
  const [gameMode, setGameMode] = useState('free'); // Tracks selected game mode

  // Initialize game components and leaderboards
  useEffect(() => {
    const canvas = document.getElementById('tearCatchGameCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentNode.offsetWidth;
      canvas.height = canvas.parentNode.offsetHeight;
    }
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
  const handleGameStart = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (gameMode === 'paid') {
      // Check balance using Suiet's getBalance API
      try {
        const balance = await wallet.getBalance();
        if (parseFloat(balance) < 0.2) {
          alert('Insufficient balance for paid game!');
          return;
        }

        // Handle payment transaction to play paid game
        const recipient = '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a';
        const tx = await wallet.signAndExecuteTransaction({
          transaction: {
            type: 'transfer',
            recipient,
            amount: 0.2
          }
        });
        console.log('Payment successful', tx);
      } catch (error) {
        console.error('Payment failed:', error);
        alert('Payment failed, please try again later.');
        return;
      }
    }

    // Start the game after payment (if paid) or for a free game
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      score: 0,
      isGameOver: false
    }));

    // Initialize game logic here (depending on mode)
    if (window.gameManager) {
      window.gameManager.startGame(gameMode); // Pass gameMode to game manager
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
        <header>
          {/* Connect button placed in the header */}
          <ConnectButton />
        </header>

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

