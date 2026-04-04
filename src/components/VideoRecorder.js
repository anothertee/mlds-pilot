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

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-500">{error}</p>}

      {status === 'idle' && (
        <button
          onClick={startCamera}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
        >
          Enable camera
        </button>
      )}

      {(status === 'ready' || status === 'recording') && (
        <div className="space-y-3">
          <div className="relative">
            <video
              ref={videoCallbackRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded border border-gray-200 bg-gray-50 h-48 object-cover"
            />
            {status === 'recording' && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {formatDuration(duration)}
              </div>
            )}
          </div>

          {status === 'ready' && (
            <button
              onClick={startRecording}
              className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              Start recording
            </button>
          )}

          {status === 'recording' && (
            <button
              onClick={stopRecording}
              className="w-full py-2 px-4 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              Stop recording
            </button>
          )}
        </div>
      )}

      {status === 'preview' && recordedURL && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preview
            </label>
            <video
              src={recordedURL}
              controls
              className="w-full rounded border border-gray-200 h-48 object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={retake}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={useRecording}
              className="flex-1 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
            >
              Use this recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}