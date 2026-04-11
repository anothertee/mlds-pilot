'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export default function VideoRecorder({ onRecordingComplete }) {
  const [status, setStatus] = useState('idle');
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedURL, setRecordedURL] = useState(null);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const videoCallbackRef = useCallback((node) => {
    if (node !== null) {
      videoRef.current = node;
      if (streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(timerRef.current);
    };
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('ready');
      setError(null);
      logger.info('VideoRecorder', 'Camera started');
    } catch (err) {
      logger.error('VideoRecorder', 'Camera access failed', {
        message: err.message,
      });
      setError('Camera access denied. Please allow camera access and try again.');
    }
  }

  function startRecording() {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setDuration(0);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedURL(url);
      setStatus('preview');
      clearInterval(timerRef.current);
      logger.success('VideoRecorder', 'Recording complete', {
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      });
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setStatus('recording');

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    logger.info('VideoRecorder', 'Recording started');
  }

  function stopRecording() {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      stopStream();
      logger.info('VideoRecorder', 'Recording stopped');
    }
  }

  function retake() {
    if (recordedURL) {
      URL.revokeObjectURL(recordedURL);
    }
    setRecordedBlob(null);
    setRecordedURL(null);
    setStatus('idle');
    setDuration(0);
    logger.info('VideoRecorder', 'Retake initiated');
  }

  function useRecording() {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `recording_${Date.now()}.webm`, {
      type: 'video/webm',
    });
    logger.info('VideoRecorder', 'Recording accepted', {
      filename: file.name,
    });
    onRecordingComplete(file);
  }

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const outlinedBtnBase = {
    padding: '0.625rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderRadius: '2px',
    cursor: 'pointer',
    background: 'transparent',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-rejected)', flexShrink: 0 }}>{error}</p>
      )}

      {/* Idle — camera not enabled */}
      {status === 'idle' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--color-border)',
          borderRadius: '2px',
          gap: '1.5rem',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
            Camera not enabled
          </p>
          <button
            onClick={startCamera}
            style={{
              ...outlinedBtnBase,
              border: '1.5px solid var(--color-body)',
              color: 'var(--color-body)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-body)';
              e.currentTarget.style.color = 'var(--color-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-body)';
            }}
          >
            Enable camera
          </button>
        </div>
      )}

      {/* Ready / Recording — live feed */}
      {(status === 'ready' || status === 'recording') && (
        <>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '2px' }}>
            <video
              ref={videoCallbackRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#000', display: 'block' }}
            />
            {status === 'recording' && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', padding: '0.375rem 0.625rem', borderRadius: '2px', fontFamily: 'var(--font-dm-mono), monospace' }}>
                <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--color-rejected)', display: 'inline-block', animation: 'breathe 1.5s ease-in-out infinite' }} />
                {formatDuration(duration)}
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0 }}>
            {status === 'ready' && (
              <button
                onClick={startRecording}
                style={{
                  ...outlinedBtnBase,
                  width: '100%',
                  border: '1.5px solid var(--color-body)',
                  color: 'var(--color-body)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-body)';
                  e.currentTarget.style.color = 'var(--color-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-body)';
                }}
              >
                Start recording
              </button>
            )}

            {status === 'recording' && (
              <button
                onClick={stopRecording}
                style={{
                  ...outlinedBtnBase,
                  width: '100%',
                  border: '1.5px solid var(--color-rejected)',
                  color: 'var(--color-rejected)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-rejected)';
                  e.currentTarget.style.color = 'var(--color-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-rejected)';
                }}
              >
                Stop recording
              </button>
            )}
          </div>
        </>
      )}

      {/* Preview — recorded clip */}
      {status === 'preview' && recordedURL && (
        <>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '2px' }}>
            <video
              src={recordedURL}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#000', display: 'block' }}
            />
          </div>

          <div style={{ flexShrink: 0, display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={retake}
              style={{
                ...outlinedBtnBase,
                flex: 1,
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-body)';
                e.currentTarget.style.color = 'var(--color-surface)';
                e.currentTarget.style.borderColor = 'var(--color-body)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-secondary)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              Retake
            </button>
            <button
              onClick={useRecording}
              style={{
                ...outlinedBtnBase,
                flex: 1,
                border: '1.5px solid var(--color-body)',
                color: 'var(--color-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-body)';
                e.currentTarget.style.color = 'var(--color-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-body)';
              }}
            >
              Use this recording
            </button>
          </div>
        </>
      )}
    </div>
  );
}
