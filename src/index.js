// index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css'; // Important for wallet styling
import GameApp from './GameApp';

const GameWrapper = () => {
  return (
    <WalletProvider>
      <GameApp />
    </WalletProvider>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-game-root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <GameWrapper />
      </React.StrictMode>
    );
  }
});
