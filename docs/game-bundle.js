// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom';

// Import GameApp component from the correct relative path
import GameApp from '../src/GameApp.jsx';  // Adjust the path as needed

// Render the GameApp component to a DOM element
ReactDOM.render(
  <React.StrictMode>
    <GameApp />
  </React.StrictMode>,
  document.getElementById('react-game-root')  // This is your target element in the HTML
);

