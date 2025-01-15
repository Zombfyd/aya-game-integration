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
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);

  // Debug log for wallet state changes
  useEffect(() => {
    console.log('Wallet state changed:', {
      connected: wallet.connected,
      account: wallet.account,
      status: wallet.status
    });
  }, [wallet.connected, wallet.account, wallet.status]);

  // Initialize game and handle wallet connection
  useEffect(() => {
    const initializeGame = async () => {
      try {
        if (window.gameManager) {
          await window.gameManager.initialize();
        }
        setIsWalletInitialized(true);
      } catch (error) {
        console.error('Error initializing game:', error);
      }
    };
    initializeGame();
  }, []);

  // Update wallet address when connection changes
  useEffect(() => {
    const updateWalletState = async () => {
      if (wallet.connected && wallet.account) {
        console.log('Wallet connected:', wallet.account.address);
        window.currentWalletAddress = wallet.account.address;
        // Fetch leaderboards when wallet connects
        await fetchLeaderboards();
      } else {
        console.log('Wallet disconnected or not ready');
        window.currentWalletAddress = null;
      }
    };
    updateWalletState();
  }, [wallet.connected, wallet.account]);

  const fetchLeaderboards = async () => {
    console.log('Fetching leaderboards...');
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const fetchWithTimeout = async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(`${url}?t=${timestamp}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          clearTimeout(timeout);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log(`Fetched data for ${url}:`, data); // Debug log
          return data;
        } catch (error) {
          clearTimeout(timeout);
          throw error;
        }
      };

      const [mainFreeData, secondaryFreeData, mainPaidData, secondaryPaidData] = await Promise.all([
        fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/main/free'),
        fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/secondary/free'),
        fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/main/paid'),
        fetchWithTimeout('https://ayagame.onrender.com/api/scores/leaderboard/secondary/paid')
      ]);

      console.log('Setting leaderboard data:', {
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
      console.error('Error fetching leaderboards:', error);
      // Set empty arrays if fetch fails but don't throw the error
      setLeaderboardData({
        mainFree: [],
        secondaryFree: [],
        mainPaid: [],
        secondaryPaid: []
      });
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
          <div className="wallet-status">
            {wallet.connected ? (
              <span className="connected">
                Connected: {wallet.account?.address.slice(0, 6)}...
                {wallet.account?.address.slice(-4)}
              </span>
            ) : (
              <span className="disconnected">Not Connected</span>
            )}
          </div>
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

        {/* Only show game content if wallet is initialized */}
        {isWalletInitialized && (
          <>
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
          </>
        )}

        {/* Add debug information in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info" style={{ position: 'fixed', bottom: 0, left: 0, padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
            <p>Wallet Connected: {String(wallet.connected)}</p>
            <p>Wallet Address: {wallet.account?.address || 'None'}</p>
            <p>Game Mode: {gameMode}</p>
            <p>Leaderboard Data: {Object.keys(leaderboardData).map(key => 
              `${key}: ${leaderboardData[key]?.length || 0} entries`
            ).join(', ')}</p>
          </div>
        )}
      </div>
    </WalletProvider>
  );
};

export default GameApp;
