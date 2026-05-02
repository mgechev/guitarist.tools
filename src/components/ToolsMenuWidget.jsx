import React, { useState } from 'react';
import MetronomeWidget from './MetronomeWidget';
import TunerPanel from './TunerPanel';
import AudioInputTracker from './AudioInputTracker';

const ToolsMenuWidget = ({ activePitchData, onPitchDetected }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'metronome', 'tuner', 'connect'

  const togglePanel = (panelName) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
    }
    setIsMenuOpen(false); // Close the menu when a panel is opened
  };

  return (
    <div className="tools-widget-container">
      {/* Panels */}
      <MetronomeWidget 
        isOpen={activePanel === 'metronome'} 
        onClose={() => setActivePanel(null)} 
      />
      
      {activePanel === 'tuner' && (
        <TunerPanel 
          activePitchData={activePitchData} 
          onClose={() => setActivePanel(null)} 
        />
      )}

      {activePanel === 'connect' && (
        <div className="connect-panel glass-panel fade-in">
          <div className="connect-header">
            <h3>Connect Instrument</h3>
            <button 
              className="close-panel-btn" 
              onClick={() => setActivePanel(null)}
              title="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <AudioInputTracker onPitchDetected={onPitchDetected} />
          </div>
        </div>
      )}

      {/* Speed Dial Menu */}
      <div className={`tools-menu ${isMenuOpen ? 'open' : ''}`}>
        <button 
          className="tool-btn" 
          onClick={() => togglePanel('metronome')}
          title="Metronome"
        >
          <span className="material-symbols-outlined">timer</span>
          <span className="tool-label">Metronome</span>
        </button>
        <button 
          className="tool-btn" 
          onClick={() => togglePanel('tuner')}
          title="Tuner"
        >
          <span className="material-symbols-outlined">tune</span>
          <span className="tool-label">Tuner</span>
        </button>
        <button 
          className="tool-btn" 
          onClick={() => togglePanel('connect')}
          title="Connect"
        >
          <span className="material-symbols-outlined">settings_input_component</span>
          <span className="tool-label">Connect</span>
        </button>
      </div>

      {/* Main Toggle Button */}
      <button 
        className={`tools-toggle-btn ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        title="Tools"
      >
        <span className="material-symbols-outlined">
          {isMenuOpen ? 'close' : 'build'}
        </span>
      </button>
    </div>
  );
};

export default ToolsMenuWidget;
