import React from 'react';
import Game from './components/Game';
import './App.css';
import ConnectionManager from './components/ConnectionManager';
import Controls from './components/Controls';
import { PlayerControlsProvider } from './contexts/PlayerControlsContext';

function App() {
  return (
    <PlayerControlsProvider>
      <div className="flex w-full h-full relative">
        <ConnectionManager />

        {/* Controls component - will render appropriate UI based on device */}
        <Controls />

        {/* Game canvas container */}
        <div className="w-full h-full">
          <Game />
        </div>
      </div>
    </PlayerControlsProvider>
  );
}

export default App;
