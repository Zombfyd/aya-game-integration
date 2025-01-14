import React from 'react';
import { createRoot } from 'react-dom/client';
import GameApp from './GameApp';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-game-root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <GameApp />
      </React.StrictMode>
    );
  }
});
