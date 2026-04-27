import React, { useState } from 'react';
import ExploreMode from './components/ExploreMode';
import PracticeMode from './components/PracticeMode';
import SideNav from './components/SideNav';
import MetronomeWidget from './components/MetronomeWidget';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [keyIndex, setKeyIndex] = useState(0); // C
  const [isMinor, setIsMinor] = useState(false); // Major
  const [shape, setShape] = useState('C');

  return (
    <div className="app-layout">
      <SideNav />
      <div className="app-main">
        <div className="app-container">
          <header className="app-header glass-panel">
        <div className="logo">
          <h1>CAGED <span>Master</span></h1>
        </div>
        <nav className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            Explore
          </button>
          <button 
            className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
            onClick={() => setActiveTab('practice')}
          >
            Practice
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'explore' ? (
          <ExploreMode 
            keyIndex={keyIndex} setKeyIndex={setKeyIndex}
            isMinor={isMinor} setIsMinor={setIsMinor}
            shape={shape} setShape={setShape}
          />
        ) : (
          <PracticeMode />
        )}
      </main>
    </div>
  </div>
  <MetronomeWidget />
</div>
  );
}

export default App;
