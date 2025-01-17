// GameApp.jsx
import React, { useState, useEffect } from 'react';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import './App.css';
import config from './config';

const GameApp = () => {
  // Wallet hook and state management
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

// In your handleGameStart function, update the payment transaction:
const handleGameStart = async () => {
  if (!wallet.connected) {
    alert('Please connect your wallet first');
    return;
  }

  if (gameMode === 'paid') {
    try {
      setPaying(true);
      setTransactionInProgress(true);
      
      // Get coins owned by the wallet
      const coins = await wallet.getBalance();

        owner: wallet.account.address,
        coinType: '0x2::sui::SUI'  // Specify SUI coin type
      });
      
      // Find a coin with sufficient balance
      const coin = coins.find(c => c.balance >= 200000000);
      if (!coin) {
        throw new Error('Insufficient balance');
      }

      const response = await wallet.signAndExecuteTransaction({
        transaction: {
          kind: 'moveCall',
          data: {
            packageObjectId: '0x4bfa52ee471bd01ea0ade83a343de62a4c500f9adc375eb4426a92042887b13d',
            module: 'payment',
            function: 'pay_for_game',
            typeArguments: ['0x2::sui::SUI'],
            arguments: [
              coin.coinObjectId,
              '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a'
            ],
            gasBudget: 2000000,
          }
        }
      });
    
      console.log('Transaction response:', response);
      
      if (response?.effects?.status?.status === 'success') {
        const events = response.effects?.events || [];
        const paymentEvent = events.find(e => 
          e.type.includes('PaymentProcessed')
        );
        
        if (paymentEvent) {
          console.log('Payment event found:', paymentEvent);
          startGame();
          setTransactionInProgress(false);
        } else {
          console.warn('No payment event found in transaction');
          startGame();
          setTransactionInProgress(false);
        }
      } else {
        console.error('Transaction failed:', response?.effects?.status);
        throw new Error('Transaction failed: ' + (response?.effects?.status?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during payment process:', error);
      alert('Payment failed: ' + (error.message || 'Please make sure you have enough SUI.'));
      setPaying(false);
      setTransactionInProgress(false);
    }
  } else {
    startGame();
  }
};
const startGame = () => {
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
        timestamp: Date.now()
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
          message: scoreMessage
        }),
      });

      if (response.ok) {
        alert('Score submitted successfully!');
        fetchLeaderboards(); // Refresh leaderboards after submission
      } else {
        throw new Error('Failed to submit score');
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
      {/* Add the new transaction status here */}
      {gameMode === 'paid' && transactionInProgress && (
        <div className="transaction-status">
          Transaction in progress...
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
