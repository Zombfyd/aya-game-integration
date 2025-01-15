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
    isGameOver: false,
  });
  const [leaderboardData, setLeaderboardData] = useState({
    main: [],
    secondary: [],
  });
  const [gameMode, setGameMode] = useState('free'); // Tracks selected game mode
  const [paying, setPaying] = useState(false); // Tracks if the user is in the process of paying

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
    // Ensure that we're fetching the right leaderboards for 'paid' and 'free' game modes
    const [mainFreeData, secondaryFreeData, mainPaidData, secondaryPaidData] = await Promise.all([
      fetch('https://ayagame.onrender.com/api/scores/leaderboard/main/free').then((res) => res.json()),
      fetch('https://ayagame.onrender.com/api/scores/leaderboard/secondary/free').then((res) => res.json()),
      fetch('https://ayagame.onrender.com/api/scores/leaderboard/main/paid').then((res) => res.json()),
      fetch('https://ayagame.onrender.com/api/scores/leaderboard/secondary/paid').then((res) => res.json()),
    ]);

    setLeaderboardData({
      mainFree: mainFreeData,
      secondaryFree: secondaryFreeData,
      mainPaid: mainPaidData,
      secondaryPaid: secondaryPaidData,
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
  }
};

  // Function to handle game start, with payment for paid game
  const handleGameStart = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    // Handle paid game start
    if (gameMode === 'paid') {
      // Check wallet balance
      try {
        const balance = await wallet.getBalance();
        const balanceInSUI = parseFloat(balance);

        if (balanceInSUI < 0.2) {
          alert('Insufficient balance! You need 0.2 SUI to play a paid game.');
          return;
        }

        // Prompt the user for payment
        const proceed = window.confirm('You need to pay 0.2 SUI to start the game. Proceed with payment?');

        if (!proceed) return;

        // Proceed with payment to start game
        setPaying(true);

        const recipient = '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a';
        const tx = await wallet.signAndExecuteTransaction({
          transaction: {
            type: 'transfer',
            recipient,
            amount: 0.2,
          },
        });

        console.log('Payment successful:', tx);

        // Once payment is successful, start the game
        startGame();
      } catch (error) {
        console.error('Error during payment process:', error);
        alert('Payment failed. Please try again later.');
      }
    } else {
      // Start game for free mode
      startGame();
    }
  };

  // Function to handle the actual start of the game
  const startGame = () => {
    setPaying(false); // Reset paying status
    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      score: 0,
      isGameOver: false,
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
        {(data || []).map((entry, index) => (
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

      {!gameState.gameStarted && (
        <div id="startGame" className="game-popup" style={{ display: 'block' }}>
          <h2>Ready to Play?</h2>
          <button onClick={handleGameStart}>
            {gameMode === 'paid' ? 'Pay 0.2 SUI and Start Game' : 'Start Free Game'}
          </button>
        </div>
      )}

      <canvas id="tearCatchGameCanvas" className="game-canvas" />

      <div className="leaderboards-container">
        {/* Render leaderboards for Free and Paid Game Types */}
        {gameMode === 'paid' ? (
          <>
            {renderLeaderboard(leaderboardData.mainPaid, 'Main Paid Leaderboard')}
            {renderLeaderboard(leaderboardData.secondaryPaid, 'Secondary Paid Leaderboard')}
          </>
        ) : (
          <>
            {renderLeaderboard(leaderboardData.mainFree, 'Main Free Leaderboard')}
            {renderLeaderboard(leaderboardData.secondaryFree, 'Secondary Free Leaderboard')}
          </>
        )}
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
