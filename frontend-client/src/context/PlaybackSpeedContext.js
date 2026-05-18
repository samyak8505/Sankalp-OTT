import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const PLAYBACK_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

const PlaybackSpeedContext = createContext({
  speed: 1,
  setSpeed: () => {},
  speeds: PLAYBACK_SPEED_OPTIONS,
});

export function PlaybackSpeedProvider({ children }) {
  const [speed, setSpeedState] = useState(1);

  const setSpeed = useCallback((next) => {
    const n = Number(next);
    if (!Number.isFinite(n) || n <= 0) return;
    setSpeedState(n);
  }, []);

  const value = useMemo(
    () => ({ speed, setSpeed, speeds: PLAYBACK_SPEED_OPTIONS }),
    [speed, setSpeed]
  );

  return (
    <PlaybackSpeedContext.Provider value={value}>
      {children}
    </PlaybackSpeedContext.Provider>
  );
}

export function usePlaybackSpeed() {
  return useContext(PlaybackSpeedContext);
}
