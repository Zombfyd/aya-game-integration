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
      
      // Updated transaction format for Sui wallet kit
      try {
        const response = await wallet.signAndExecuteTransaction({
          transaction: {
            kind: 'moveCall',
            data: {
              packageObjectId: '0x2',
              module: 'pay',
              function: 'split_and_transfer',
              typeArguments: ['0x2::sui::SUI'],
              arguments: [
                recipient,
                (0.2 * 1000000000).toString() // Convert to string to avoid precision issues
              ],
              gasBudget: 10000,
            }
          }
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
  setIsLeaderboardLoading(true); // Show loading state
  console.log('Fetching leaderboards...'); // Debug log

  try {
    // Helper function that matches your original fetch approach
    const fetchSingleLeaderboard = async (type) => {
      const response = await fetch(`https://ayagame.onrender.com/api/scores/leaderboard/${type}/free`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      return response.json();
    };

    // Fetch all leaderboards using your proven approach
    const [mainFreeData, secondaryFreeData, mainPaidData, secondaryPaidData] = await Promise.all([
      fetchSingleLeaderboard('main'),
      fetchSingleLeaderboard('secondary'),
      fetchSingleLeaderboard('main'), // For paid leaderboards
      fetchSingleLeaderboard('secondary')  // For paid leaderboards
    ]);

    // Update the state with fetched data
    setLeaderboardData({
      mainFree: mainFreeData || [],
      secondaryFree: secondaryFreeData || [],
      mainPaid: mainPaidData || [],
      secondaryPaid: secondaryPaidData || []
    });

    console.log('Leaderboards fetched successfully:', {
      mainFreeData,
      secondaryFreeData,
      mainPaidData,
      secondaryPaidData
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    // Set empty arrays for all leaderboards on error
    setLeaderboardData({
      mainFree: [],
      secondaryFree: [],
      mainPaid: [],
      secondaryPaid: []
    });
  } finally {
    setIsLeaderboardLoading(false); // Hide loading state
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
