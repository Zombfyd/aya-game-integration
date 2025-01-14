import React from 'react';
import ReactDOM from 'react-dom/client';  // Import from 'react-dom/client' for React 18+

import GameApp from '../src/GameApp.jsx';  // Adjust the path as needed

const root = ReactDOM.createRoot(document.getElementById('react-game-root'));  // Create root node
root.render(
  <React.StrictMode>
    <GameApp />
  </React.StrictMode>
);

// Ensure methods that the frontend script uses are part of gameApp state
window.gameManager = {
  startGame: () => {
    // Handle starting the game
  },
  initialize: () => {
    // Initialize the game logic
  }
};
