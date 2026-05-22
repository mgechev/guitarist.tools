import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import ExploreMode from './components/ExploreMode';
import PracticeMode from './components/PracticeMode';
import PlayMode from './components/PlayMode';
import RhythmMode from './components/RhythmMode';
import LegatoMode from './components/LegatoMode';
import BluesCoach from './components/BluesCoach';
import SideNav from './components/SideNav';
import ToolsMenuWidget from './components/ToolsMenuWidget';
import './index.css';
import styles from './App.module.css';

function App() {
  const location = useLocation();
  const isPlayMode = location.pathname.startsWith('/play');
  const isRhythmMode = location.pathname.startsWith('/rhythm');
  const isLegatoMode = location.pathname.startsWith('/legato');
  const isBluesMode = location.pathname.startsWith('/blues');
  const [keyIndex, setKeyIndex] = useState(0); // C
  const [isMinor, setIsMinor] = useState(false); // Major
  const [shape, setShape] = useState('C');
  const [activePitchData, setActivePitchData] = useState(null);
  const [activeAttackTime, setActiveAttackTime] = useState(null);
  const [activeAudioData, setActiveAudioData] = useState(null);
  const [isGuitarConnected, setIsGuitarConnected] = useState(false);

  return (
    <div className={styles.appLayout}>
      <SideNav />
      <div className={styles.appMain}>
        <div className={styles.appContainer}>
          <header className={`${styles.appHeader} glass-panel`}>
        <div className={styles.logo}>
          <h1>{isPlayMode ? 'Play' : isRhythmMode ? 'Rhythm' : isLegatoMode ? 'Legato' : isBluesMode ? 'Blues Coach' : 'CAGED'}</h1>
        </div>
        {isPlayMode && (
          <nav className={styles.tabs}>
            <NavLink 
              to="/play/visualizer"
              className={({ isActive }) => `${styles.tabBtn} ${isActive ? styles.active : ''}`}
            >
              Visualizer
            </NavLink>
            <NavLink 
              to="/play/tab"
              className={({ isActive }) => `${styles.tabBtn} ${isActive ? styles.active : ''}`}
            >
              Infinite Tab
            </NavLink>
          </nav>
        )}
        
        {(!isPlayMode && !isRhythmMode && !isLegatoMode && !isBluesMode) && (
          <nav className={styles.tabs}>
            <NavLink 
              to="/explore"
              className={({ isActive }) => `${styles.tabBtn} ${isActive ? styles.active : ''}`}
            >
              Explore
            </NavLink>
            <NavLink 
              to="/practice"
              className={({ isActive }) => `${styles.tabBtn} ${isActive ? styles.active : ''}`}
            >
              Practice
            </NavLink>
          </nav>
        )}
      </header>

      <main className={styles.mainContent}>
        <Routes>
          <Route path="/explore" element={
            <ExploreMode 
              keyIndex={keyIndex} setKeyIndex={setKeyIndex}
              isMinor={isMinor} setIsMinor={setIsMinor}
              shape={shape} setShape={setShape}
            />
          } />
          <Route path="/practice" element={<PracticeMode activePitchData={activePitchData} isGuitarConnected={isGuitarConnected} />} />
          <Route path="/rhythm" element={<RhythmMode activeAttackTime={activeAttackTime} isGuitarConnected={isGuitarConnected} />} />
          <Route path="/legato" element={<LegatoMode activePitchData={activePitchData} activeAttackTime={activeAttackTime} activeAudioData={activeAudioData} isGuitarConnected={isGuitarConnected} />} />
          <Route path="/blues" element={<BluesCoach activePitchData={activePitchData} activeAttackTime={activeAttackTime} isGuitarConnected={isGuitarConnected} />} />
          <Route path="/play/*" element={<PlayMode activePitchData={activePitchData} activeAttackTime={activeAttackTime} activeAudioData={activeAudioData} />} />
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </main>
    </div>
  </div>
  <ToolsMenuWidget 
    activePitchData={activePitchData} 
    onPitchDetected={setActivePitchData} 
    onAttackDetected={setActiveAttackTime}
    onAudioData={setActiveAudioData}
    onConnectionChange={setIsGuitarConnected}
  />
</div>
  );
}

export default App;
