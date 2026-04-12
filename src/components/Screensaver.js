'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaterCanvas from './WaterCanvas';

const IDLE_TIMEOUT = 60000; // 60 seconds

export default function Screensaver() {
  const [idle, setIdle] = useState(false);

  const resetTimer = useCallback(() => {
    setIdle(false);
  }, []);

  useEffect(() => {
    let timer;

    const startTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_TIMEOUT);
    };

    const handleActivity = () => {
      resetTimer();
      startTimer();
    };

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'pointerdown',
      'scroll',
    ];

    events.forEach((e) => window.addEventListener(e, handleActivity));
    startTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [resetTimer]);

  return (
    <AnimatePresence>
      {idle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            cursor: 'pointer',
          }}
          onClick={resetTimer}
        >
          <WaterCanvas />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <p
              style={{
                color: '#12100E',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-dm-sans)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.5,
              }}
            >
              Touch to continue
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
