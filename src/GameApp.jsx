import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet, ConnectButton } from '@suiet/wallet-kit';
import './App.css';

const GameApp = () => {
  const wallet = useWallet();
  const [gameState, setGameState] = useState({
    gameStarted: false,
    score: 0,
    isGameOver: false,
  });
  const [leaderboardData, setLeaderboardData] = useState({
    mainFree: [],
    secondaryFree: [],
    mainPaid: [],
    secondaryPaid: [],
  });
  const [gameMode, setGameMode] = useState('free');
  const [paying, setPaying] = useState(false);

  // Initialize game and handle wallet connection
  useEffect(() => {
    const initializeGame = async () => {
      if (window.gameManager) {
        const initialized = await window.gameManager.initialize();
      }
    };
    initializeGame();
  }, []);

  // Update wallet address when connection changes
  useEffect(() => {
    if (wallet.connected && wallet.account) {
      window.currentWalletAddress = wallet.account.address;
    } else {
      window.currentWalletAddress = null;
    }
  }, [wallet.connected, wallet.account]);

  // Fetch leaderboards when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      fetchLeaderboards();
    }
  }, [wallet.connected]);

  const fetchLeaderboards = async () => {
    try {
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

  const handleGameStart = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (gameMode === 'paid') {
      try {
        const balance = await wallet.getBalance();
        const balanceInSUI = parseFloat(balance);

        if (balanceInSUI < 0.2) {
          alert('Insufficient balance! You need 0.2 SUI to play a paid game.');
          return;
        }

        setPaying(true);
        const recipient = '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a';
        
        try {
          const tx = await wallet.signAndExecuteTransaction({
            transaction: {
              kind: 'pay',
              data: {
                recipient: recipient,
                amount: 0.2 * 1000000000, // Convert to MIST (SUI's smallest unit)
              },
            },
          });

          console.log('Payment successful:', tx);
          startGame();
        } catch (txError) {
          console.error('Transaction failed:', txError);
          alert('Payment failed. Please try again.');
          setPaying(false);
        }
      } catch (error) {
        console.error('Error during payment process:', error);
        alert('Error processing payment. Please try again.');
        setPaying(false);
      }
    } else {
      startGame();
    }
  };

  const startGame = () => {
    setPaying(false);
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      score: 0,
      isGameOver: false,
    }));

    if (window.gameManager) {
      window.gameManager.startGame(gameMode);
    }
  };

  const handleScoreSubmit = async () => {
    if (!wallet.connected || !wallet.account) {
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
          playerWallet: wallet.account.address,
          score: gameState.score,
          gameType: 'main',
        }),
      });

      if (response.ok) {
        alert('Score submitted successfully!');
        fetchLeaderboards();
      } else {
        throw new Error('Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    }
  };

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
          <div className="mode-selector">
            <button 
              onClick={() => setGameMode('free')}
              className={gameMode === 'free' ? 'active' : ''}
            >
              Free Mode
            </button>
            <button 
              onClick={() => setGameMode('paid')}
              className={gameMode === 'paid' ? 'active' : ''}
            >
              Paid Mode
            </button>
          </div>
        </header>

        {wallet.connected && !gameState.gameStarted && (
          <div className="game-popup">
            <h2>Ready to Play?</h2>
            <button 
              onClick={handleGameStart}
              disabled={paying}
            >
              {gameMode === 'paid' ? 'Pay 0.2 SUI and Start Game' : 'Start Free Game'}
            </button>
          </div>
        )}

        {!wallet.connected && (
          <div className="game-popup">
            <h2>Connect Wallet to Play</h2>
            <p>Please connect your wallet to start playing</p>
          </div>
        )}

        <canvas id="tearCatchGameCanvas" className="game-canvas" />

        <div className="leaderboards-container">
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
          <div className="score-popup">
            <h2>Game Over!</h2>
            <p>Your Score: <span>{gameState.score}</span></p>
            <button onClick={handleScoreSubmit}>Submit Score</button>
            <button onClick={handleGameStart}>Play Again</button>
          </div>
        )}
      </div>
    </WalletProvider>
  );
};

export default GameApp;
