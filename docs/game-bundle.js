// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom/client';  // Import from 'react-dom/client' for React 18+

// Import GameApp component from the correct relative path
import GameApp from '../src/GameApp.jsx';  // Adjust the path as needed

// Render the GameApp component to a DOM element
const root = ReactDOM.createRoot(document.getElementById('react-game-root'));  // Create root node
root.render(
  <React.StrictMode>
    <GameApp />
  </React.StrictMode>
);
