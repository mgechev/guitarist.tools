import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Visualizer from './Visualizer';
import InfiniteTab from './InfiniteTab';
import styles from './PlayMode.module.css';

const PlayMode = ({ activePitchData, activeAttackTime }) => {
  return (
    <div className={styles.playMode} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="visualizer" element={<Visualizer activePitchData={activePitchData} activeAttackTime={activeAttackTime} />} />
        <Route path="tab" element={<InfiniteTab activePitchData={activePitchData} />} />
        <Route path="" element={<Navigate to="visualizer" replace />} />
      </Routes>
    </div>
  );
};

export default PlayMode;
