// GameAppWrapper.jsx
import React from 'react';
import { WalletProvider } from '@suiet/wallet-kit';

// This component ensures proper wallet provider context
const GameAppWrapper = () => {
  return (
    <WalletProvider>
      <GameApp />
    </WalletProvider>
  );
};

export default GameAppWrapper;
