import React from 'react';
import ReactDOM from 'react-dom';
import GameApp from './GameApp';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-game-root');
  if (container) {
    ReactDOM.render(<GameApp />, container);
  }
});
