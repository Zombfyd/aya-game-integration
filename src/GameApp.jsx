// GameApp.jsx
import { gameManager } from './GameManager';
window.gameManager = gameManager;
import React, { useState, useEffect } from 'react';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import './App.css';
import config from './config';
// In your handleGameStart function, update the payment transaction:
import { Transaction } from "@mysten/sui/transactions";  

const GameApp = () => {
  // Wallet hook and state management
  const [gameManagerInitialized, setGameManagerInitialized] = useState(false);
  const wallet = useWallet();
  const [walletInitialized, setWalletInitialized] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
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
         // Fetch leaderboards when wallet connects
      } else {
        console.log('Wallet disconnected or not ready');
        window.currentWalletAddress = null;
        setWalletInitialized(false);
      }
    };

    updateWalletState();
  }, [wallet.connected, wallet.account, wallet.status]);
  useEffect(() => {
  // Check configuration on app start
  if (!config.packageId || config.packageId === 'YOUR_LOCAL_PACKAGE_ID') {
    console.error('Warning: Package ID not properly configured');
  }
  if (!config.ownerAddress || config.ownerAddress === 'YOUR_LOCAL_OWNER_ADDRESS') {
    console.error('Warning: Owner address not properly configured');
  }
}, []);
  useEffect(() => {
    const initializeGameManager = async () => {
      try {
        console.log('Attempting to initialize game manager...');
        if (!window.gameManager) {
          console.error('GameManager not found on window object');
          return;
        }

        const success = await window.gameManager.initialize();
        if (success) {
          console.log('Game manager initialized successfully');
          setGameManagerInitialized(true);
        } else {
          console.error('Game manager initialization returned false');
        }
      } catch (error) {
        console.error('Error initializing game manager:', error);
      }
    };
    fetchLeaderboards();
    initializeGameManager();
  }, []); 
  // Initialize game when wallet is ready
  useEffect(() => {
  const initializeGame = async () => {
    try {
      if (window.gameManager && walletInitialized) {
        console.log('Initializing game manager...');
        const success = await window.gameManager.initialize();
        
        if (success) {
          console.log('Game manager initialized successfully');
          // Add event listener for game over
          window.gameManager.onGameOver = (finalScore) => {
            setGameState(prev => ({
              ...prev,
              score: finalScore,
              isGameOver: true
            }));
          };
        } else {
          console.error('Game manager initialization failed');
        }
      }
    } catch (error) {
      console.error("Failed to initialize game:", error);
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
      setTransactionInProgress(true);
      
      console.log('Initiating payment transaction...');

      // Create a new transaction
      const tx = new Transaction();
      
      // Build the move call for the game payment
      tx.moveCall({
        target: `${config.packageId}::payment::pay_for_game`,
        typeArguments: [], // No type arguments needed for this call
        arguments: [
          tx.pure.address(config.ownerAddress) // Properly format the owner address argument
        ],
      });

      // Execute the transaction with proper type specification
      const response = await wallet.signAndExecuteTransaction({
        transaction: tx,
        chain: 'sui', // Specify the chain
        options: {
          showEvents: true,
          showEffects: true,
          showInput: true,
          showResults: true,
        }
      });

      if (response?.effects?.status?.status === 'success') {
        console.log('Payment successful, starting game...');
        startGame();
      } else {
        throw new Error('Transaction failed: ' + (response?.effects?.status?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
      
      // Log additional details to help with debugging
      console.error('Transaction details:', {
        packageId: config.packageId,
        ownerAddress: config.ownerAddress,
        error: error
      });
    } finally {
      setPaying(false);
      setTransactionInProgress(false);
    }
  } else {
    console.log('Starting free game...');
    startGame();
  }
};
const startGame = () => {
    if (!gameManagerInitialized) {
      console.error('Cannot start game - game manager not initialized');
      alert('Please wait for game to initialize');
      return;
    }
    // Reset paying state and initialize new game state
    setPaying(false);
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      score: 0,
      isGameOver: false,
    }));

    // Start the game using the game manager with current mode
    if (window.gameManager) {
    window.gameManager.startGame(gameMode);
    console.log('Game started with mode:', gameMode);
  } else {
    console.error('Game manager not initialized');
  }
};

  const handleScoreSubmit = async () => {
  if (!wallet.connected || !wallet.account) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    // Create and sign a message containing the score data
    const scoreMessage = JSON.stringify({
      playerAddress: wallet.account.address,
      score: gameState.score,
      timestamp: Date.now(),
    });

    // Sign the message for verification
    const signature = await wallet.signPersonalMessage({
      message: new TextEncoder().encode(scoreMessage),
    });

    // Submit score data to the server
    const response = await fetch('https://ayagame.onrender.com/api/scores/submit/free', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerWallet: wallet.account.address,
        score: gameState.score,
        gameType: 'main',
        signature: signature,
        message: scoreMessage,
      }),
    });

    if (response.ok) {
      alert('Score submitted successfully!');
      fetchLeaderboards(); // Refresh leaderboards after submission
    } else {
      const textResponse = await response.text();
      throw new Error(`Failed to submit score: ${textResponse}`);
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    alert('Failed to submit score. Please try again.');
  }
};

const fetchLeaderboards = async () => {
  console.log('Starting leaderboard fetch...');
  setIsLeaderboardLoading(true);
  
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    const fetchWithTimeout = async (url) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      try {
        console.log(`Fetching from ${url}...`);
        const response = await fetch(`${url}?t=${timestamp}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeout);
        
        if (!response.ok) {
          console.error(`Error response from ${url}:`, response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text(); // Get response as text first
        console.log(`Raw response from ${url}:`, text);
        
        try {
          const data = JSON.parse(text);
          console.log(`Parsed data from ${url}:`, data);
          return data;
        } catch (parseError) {
          console.error(`JSON parse error for ${url}:`, parseError);
          throw new Error(`Failed to parse JSON from ${url}`);
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error(`Fetch error for ${url}:`, error);
        throw error;
      }
    };

    // Fetch each leaderboard separately to better track errors
    const mainFreeData = await fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/main/free')
      .catch(error => {
        console.error('Main free leaderboard error:', error);
        return [];
      });

    const secondaryFreeData = await fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/secondary/free')
      .catch(error => {
        console.error('Secondary free leaderboard error:', error);
        return [];
      });

    const mainPaidData = await fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/main/paid')
      .catch(error => {
        console.error('Main paid leaderboard error:', error);
        return [];
      });

    const secondaryPaidData = await fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/secondary/paid')
      .catch(error => {
        console.error('Secondary paid leaderboard error:', error);
        return [];
      });

    console.log('All leaderboard data fetched:', {
      mainFreeData,
      secondaryFreeData,
      mainPaidData,
      secondaryPaidData
    });

    setLeaderboardData({
      mainFree: mainFreeData || [],
      secondaryFree: secondaryFreeData || [],
      mainPaid: mainPaidData || [],
      secondaryPaid: secondaryPaidData || []
    });
  } catch (error) {
    console.error('Overall leaderboard fetch error:', error);
    setLeaderboardData({
      mainFree: [],
      secondaryFree: [],
      mainPaid: [],
      secondaryPaid: []
    });
  } finally {
    setIsLeaderboardLoading(false);
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
  <div className={`game-container ${gameState.gameStarted ? 'active' : ''}`}>
    {!gameState.gameStarted && (
      <header>
        <div className="wkit-connected-container">
          <ConnectButton />
        </div>
        
        {wallet.connected && wallet.account && (
          <div className="wallet-status">
            <div className="wallet-info">
              Connected to {wallet.name}
              <br />
              {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
            </div>
          </div>
        )}

        {wallet.connecting && (
          <div className="wallet-status">
            <div>Connecting...</div>
          </div>
        )}

        <div className="mode-selector">
          <button 
            onClick={() => {
              setGameMode('free');
              setTransactionInProgress(false);
              setPaying(false);
            }}
            className={gameMode === 'free' ? 'active' : ''}
            disabled={!wallet.connected}
          >
            Free Mode
          </button>
          <button 
            onClick={() => {
              setGameMode('paid');
              setTransactionInProgress(false);
              setPaying(false);
            }}
            className={gameMode === 'paid' ? 'active' : ''}
            disabled={!wallet.connected}
          >
            Paid Mode
          </button>
        </div>

        {wallet.connected && (
          <button 
            onClick={handleGameStart}
            disabled={paying}
            className="start-button"
          >
            {gameMode === 'paid' ? 'Pay 0.2 SUI and Start Game' : 'Start Free Game'}
          </button>
        )}

        {!wallet.connected && (
          <p className="connect-prompt">Please connect your wallet to start playing</p>
        )}

        {gameMode === 'paid' && transactionInProgress && (
          <div className="transaction-status">
            Transaction in progress...
          </div>
        )}
      </header>
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
          <p>Game Manager Initialized: {String(gameManagerInitialized)}</p>
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
