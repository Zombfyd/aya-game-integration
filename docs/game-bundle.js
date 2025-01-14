// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom';

// Import your GameApp component
import GameApp from './src/GameApp.jsx';

// Render the GameApp component to a DOM element
ReactDOM.render(
  <React.StrictMode>
    <GameApp />
  </React.StrictMode>,
  document.getElementById('react-game-root') // Make sure you have an element with id='root' in your HTML
);
