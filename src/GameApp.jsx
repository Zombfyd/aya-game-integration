import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet, ConnectButton } from '@suiet/wallet-kit';
import './App.css';

// Main GameApp component
const GameApp = () => {
  const wallet = useWallet(); // Access wallet via hook
  const [gameState, setGameState] = useState({
    gameStarted: false,
    score: 0,
    isGameOver: false,
  });
  const [leaderboardData, setLeaderboardData] = useState({
    main: [],
    secondary: [],
    mainPaid: [],
    secondaryPaid: [],
  });
  const [gameMode, setGameMode] = useState(null); // Tracks selected game mode (free or paid)
  const [triesRemaining, setTriesRemaining] = useState(5); // Tracks remaining tries for paid game

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
      const [mainData, secondaryData, mainPaidData, secondaryPaidData] = await Promise.all([
        fetch('https://ayagame.onrender.com/api/scores/leaderboard/main/free').then((res) => res.json()),
        fetch('https://ayagame.onrender.com/api/scores/leaderboard/secondary/free').then((res) => res.json()),
        fetch('https://ayagame.onrender.com/api/scores/leaderboard/main/paid').then((res) => res.json()),
        fetch('https://ayagame.onrender.com/api/scores/leaderboard/secondary/paid').then((res) => res.json()),
      ]);
      setLeaderboardData({
        main: mainData,
        secondary: secondaryData,
        mainPaid: mainPaidData,
        secondaryPaid: secondaryPaidData,
      });
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    }
  };

  // Handle game start (check wallet and tries)
  const handleGameStart = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (gameMode === 'paid') {
      // Check if the user has remaining tries to play the paid game
      if (triesRemaining > 0) {
        setTriesRemaining((prev) => prev - 1); // Decrease tries remaining
        startGame();
      } else {
        // If no tries remaining, ask for payment again
        alert('You have no tries left! Please make a payment to continue.');
        try {
          const balance = await wallet.getBalance();
          if (parseFloat(balance) < 0.2) {
            alert('Insufficient balance for paid game!');
            return;
          }
          // Handle payment transaction to play the paid game
          const recipient = '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a';
          const tx = await wallet.signAndExecuteTransaction({
            transaction: {
              type: 'transfer',
              recipient,
              amount: 0.2,
            },
          });
          console.log('Payment successful', tx);
          setTriesRemaining(4); // Reset tries after payment
          startGame();
        } catch (error) {
          console.error('Payment failed:', error);
          alert('Payment failed, please try again later.');
        }
      }
    } else {
      // Start the free game without any checks
      startGame();
    }
  };

  // Start game after mode/payment validation
  const startGame = () => {
    setGameState({
      ...gameState,
      gameStarted: true,
      score: 0,
      isGameOver: false,
    });
    // Start the game logic here (in real scenario, integrate game logic manager)
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerWallet: walletAddress,
          score: gameState.score,
          gameType: 'main',
        }),
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
  const renderLeaderboard = (data, title, isPaid = false) => (
    <div className="leaderboard-wrapper">
      <h3>{title}</h3>
      <table id={isPaid ? `mainPaidLeaderboard` : `mainLeaderboard`}>
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
          <ConnectButton />
        </header>

        {/* Game Mode selection (if game hasn't started yet) */}
        {!gameState.gameStarted && !gameMode && (
          <div className="game-mode-selection">
            <h2>Select Game Mode</h2>
            <button onClick={() => setGameMode('free')}>Free Game</button>
            <button onClick={() => setGameMode('paid')}>Paid Game</button>
          </div>
        )}

        {/* Game start options after selecting the mode */}
        {gameMode && !gameState.gameStarted && (
          <div id="startGame" className="game-popup" style={{ display: 'block' }}>
            <h2>{gameMode === 'paid' ? `You have ${triesRemaining} tries left` : 'Ready to Play?'}</h2>
            <button onClick={handleGameStart}>
              {gameMode === 'paid' ? 'Start Paid Game' : 'Start Free Game'}
            </button>
          </div>
        )}

        <canvas id="tearCatchGameCanvas" className="game-canvas" />

        <div className="leaderboard-container">
          {/* Free Game Leaderboards */}
          <div className="leaderboard-section">
            <h2>Free Game Leaderboards</h2>
            {renderLeaderboard(leaderboardData.main, 'Main Leaderboard')}
            {renderLeaderboard(leaderboardData.secondary, 'Secondary Leaderboard')}
          </div>

          {/* Paid Game Leaderboards */}
          <div className="leaderboard-section">
            <h2>Paid Game Leaderboards</h2>
            {renderLeaderboard(leaderboardData.mainPaid, 'Main Leaderboard', true)}
            {renderLeaderboard(leaderboardData.secondaryPaid, 'Secondary Leaderboard', true)}
          </div>
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
