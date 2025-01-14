import React from 'react';
import ReactDOM from 'react-dom/client';
import GameApp from '../src/GameApp.jsx';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-game-root');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <GameApp />
      </React.StrictMode>
    );
  }
});

// Initialize game manager with proper error handling
window.gameManager = {
  startGame: (mode = 'free', sessionToken = null) => {
    try {
      console.log(`Starting game in ${mode} mode`);
      // Your game start logic here
      return true;
    } catch (error) {
      console.error('Error starting game:', error);
      return false;
    }
  },
  
  initialize: async () => {
    try {
      console.log('Initializing game manager');
      // Your initialization logic here
      return true;
    } catch (error) {
      console.error('Error initializing game:', error);
      return false;
    }
  }
};
