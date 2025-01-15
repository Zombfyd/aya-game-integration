import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet, ConnectButton } from '@suiet/wallet-kit';
import { Transaction } from "@mysten/sui/transactions";
import './App.css';

const GameApp = () => {
  // Get wallet instance from the hook
  const wallet = useWallet();
  
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

  // Effect to handle wallet connection state
  useEffect(() => {
    if (!wallet.connected) return;
    
    // Log wallet connection details for debugging
    console.log('Connected wallet name:', wallet.name);
    console.log('Account address:', wallet.account?.address);
    console.log('Account publicKey:', wallet.account?.publicKey);
    
    // Update global wallet address for game usage
    window.currentWalletAddress = wallet.account?.address;
    
    // Fetch leaderboards when wallet connects
    fetchLeaderboards();
  }, [wallet.connected]);

  const handleGameStart = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (gameMode === 'paid') {
      try {
        setPaying(true);
        
        // Create a new transaction for payment
        const tx = new Transaction();
        const recipient = '0xa376ef54b9d89db49e7eac089a4efca84755f6c325429af97a7ce9b3a549642a';
        const amount = 0.2 * 1000000000; // Convert to MIST (SUI's smallest unit)
        
        // Add payment to transaction
        tx.transferObjects([tx.pure(amount)], recipient);
        
        // Execute the transaction
        try {
          const response = await wallet.signAndExecuteTransaction({
            transaction: tx,
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

    // Sign the score submission message for verification
    try {
      const scoreMessage = JSON.stringify({
        playerAddress: wallet.account.address,
        score: gameState.score,
        timestamp: Date.now()
      });

      // Sign the message using the wallet
      await wallet.signPersonalMessage({
        message: new TextEncoder().encode(scoreMessage),
      });

      // Submit the score to the server
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
          <div className="wallet-info">
            {wallet.connected && (
              <div>
                Connected to {wallet.name}
                <br />
                {wallet.account?.address.slice(0, 6)}...{wallet.account?.address.slice(-4)}
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

        {/* Rest of your JSX remains the same */}
      </div>
    </WalletProvider>
  );
};

export default GameApp;
