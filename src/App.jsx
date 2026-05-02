import React, { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import ExploreMode from './components/ExploreMode';
import PracticeMode from './components/PracticeMode';
import PlayMode from './components/PlayMode';
import SideNav from './components/SideNav';
import ToolsMenuWidget from './components/ToolsMenuWidget';
import './index.css';

function App() {
  const location = useLocation();
  const isPlayMode = location.pathname === '/play';
  const [keyIndex, setKeyIndex] = useState(0); // C
  const [isMinor, setIsMinor] = useState(false); // Major
  const [shape, setShape] = useState('C');
  const [activePitchData, setActivePitchData] = useState(null);

  return (
    <div className="app-layout">
      <SideNav />
      <div className="app-main">
        <div className="app-container">
          <header className="app-header glass-panel">
        <div className="logo">
          <h1>{isPlayMode ? 'Play' : 'CAGED'}</h1>
        </div>
        {/* Only show top tabs if not in Play mode */}
        {!isPlayMode && (
          <nav className="tabs">
            <NavLink 
              to="/explore"
              className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
              Explore
            </NavLink>
            <NavLink 
              to="/practice"
              className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
              Practice
            </NavLink>
          </nav>
        )}
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/explore" element={
            <ExploreMode 
              keyIndex={keyIndex} setKeyIndex={setKeyIndex}
              isMinor={isMinor} setIsMinor={setIsMinor}
              shape={shape} setShape={setShape}
            />
          } />
          <Route path="/practice" element={<PracticeMode />} />
          <Route path="/play" element={<PlayMode activeMidiNote={activePitchData?.midiNote || null} />} />
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </main>
    </div>
  </div>
  <ToolsMenuWidget 
    activePitchData={activePitchData} 
    onPitchDetected={setActivePitchData} 
  />
</div>
  );
}

export default App;
