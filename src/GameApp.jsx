// GameApp.jsx
import React, { useState, useEffect } from 'react';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import './App.css';

const GameApp = () => {
  // Wallet hook and state management
  const wallet = useWallet();
  const [walletInitialized, setWalletInitialized] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  
  // Game state management
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

  // Enhanced wallet connection monitoring
  useEffect(() => {
    const updateWalletState = async () => {
      if (wallet.connected && wallet.account) {
        console.log('Wallet connected:', {
          name: wallet.name,
          address: wallet.account.address,
          status: wallet.status
        });
        
        window.currentWalletAddress = wallet.account.address;
        setWalletInitialized(true);
        await fetchLeaderboards(); // Fetch leaderboards when wallet connects
      } else {
        console.log('Wallet disconnected or not ready');
        window.currentWalletAddress = null;
        setWalletInitialized(false);
      }
    };

    updateWalletState();
  }, [wallet.connected, wallet.account, wallet.status]);

  // Initialize game when wallet is ready
  useEffect(() => {
    const initializeGame = async () => {
      if (window.gameManager && walletInitialized) {
        await window.gameManager.initialize();
      }
    };

    initializeGame();
  }, [walletInitialized]);

  const handleGameStart = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (gameMode === 'paid') {
      try {
        setPaying(true);
        const recipient = '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a';
        
        try {
          const response = await wallet.signAndExecuteTransaction({
            transaction: {
              kind: 'pay',
              data: {
                recipient: recipient,
                amount: 0.2 * 1000000000, // Convert to MIST
              },
            },
          });
          
          console.log('Payment successful:', response);
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

  // Rest of your code remains the same (startGame, handleScoreSubmit, fetchLeaderboards, renderLeaderboard)
  // ... 

  // Updated render method
  return (
    <div className="game-container">
      <header>
        <ConnectButton />
        <div className="wallet-status">
          {wallet.connecting && <div>Connecting...</div>}
          {wallet.connected && wallet.account && (
            <div className="wallet-info">
              Connected to {wallet.name}
              <br />
              {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
            </div>
          )}
        </div>
        <div className="mode-selector">
          <button 
            onClick={() => setGameMode('free')}
            className={gameMode === 'free' ? 'active' : ''}
            disabled={!wallet.connected}
          >
            Free Mode
          </button>
          <button 
            onClick={() => setGameMode('paid')}
            className={gameMode === 'paid' ? 'active' : ''}
            disabled={!wallet.connected}
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
        {isLeaderboardLoading ? (
          <div className="loading-indicator">Loading leaderboards...</div>
        ) : (
          gameMode === 'paid' ? (
            <>
              {renderLeaderboard(leaderboardData.mainPaid, 'Main Paid Leaderboard')}
              {renderLeaderboard(leaderboardData.secondaryPaid, 'Secondary Paid Leaderboard')}
            </>
          ) : (
            <>
              {renderLeaderboard(leaderboardData.mainFree, 'Main Free Leaderboard')}
              {renderLeaderboard(leaderboardData.secondaryFree, 'Secondary Free Leaderboard')}
            </>
          )
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

      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <p>Wallet Connected: {String(wallet.connected)}</p>
          <p>Wallet Initialized: {String(walletInitialized)}</p>
          <p>Wallet Name: {wallet.name || 'None'}</p>
          <p>Wallet Address: {wallet.account?.address || 'None'}</p>
          <p>Game Mode: {gameMode}</p>
          <p>Game Started: {String(gameState.gameStarted)}</p>
          <p>Score: {gameState.score}</p>
        </div>
      )}
    </div>
  );
};

export default GameApp;
