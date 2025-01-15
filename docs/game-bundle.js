import React from 'react';
import ReactDOM from 'react-dom/client';
import GameApp from '../src/GameApp.jsx';

// Initialize gameManager with startGame and initialize functions
window.gameManager = {
  startGame: (mode = 'free', sessionToken = null) => {
    try {
      console.log(`Starting game in ${mode} mode`);
      // Add game start logic here
      return true; // Indicate game has started
    } catch (error) {
      console.error('Error starting game:', error);
      return false;
    }
  },

  initialize: async () => {
    try {
      console.log('Initializing game manager');
      // Add initialization logic here
      return true; // Indicate game initialization is complete
    } catch (error) {
      console.error('Error initializing game:', error);
      return false;
    }
  },
};

// Wait for the DOM to be ready, then initialize React app
const container = document.getElementById('react-game-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <GameApp />
    </React.StrictMode>
  );
} else {
  console.error("Element with id 'react-game-root' not found.");
}
