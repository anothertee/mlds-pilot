'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import VideoRecorder from '@/components/VideoRecorder';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [contributor, setContributor] = useState('');
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('upload');
  const [fileURL, setFileURL] = useState(null);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function addLog(message) {
    setLogs((prev) => [...prev, { message, id: Date.now() + Math.random() }]);
  }

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileURL(url); // object URL must be created and cleaned up in an effect
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith('video/')) {
      setError('Please select a video file.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('File is too large. Please upload a video under 500MB.');
      setFile(null);
      return;
    }
    setFile(selected);
    setError(null);
  }

  function handleRecordingComplete(recordedFile) {
    setFile(recordedFile);
    setError(null);
    logger.info('UploadForm', 'Recording received', {
      filename: recordedFile.name,
    });
  }

  async function handleUpload() {
    if (!file) {
      logger.warn('UploadForm', 'Upload attempted with no file selected');
      setError('Please select or record a video first.');
      return;
    }

    if (!contributor.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!note.trim()) {
      setError('Please add a note about this movement.');
      return;
    }

    logger.info('UploadForm', 'Upload initiated', {
      filename: file.name,
      contributor: contributor || 'anonymous',
    });

    setStatus('uploading');
    setError(null);
    setLogs([]);
    setProgress(0);
    addLog('Upload initiated.');

    let fillInterval = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contributor', contributor);
      formData.append('note', note);

      addLog('Transferring file...');

      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 60));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else if (xhr.status === 413) {
            reject(new Error('File is too large to upload. Please compress your video or use a shorter clip.'));
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')); }
            catch { reject(new Error('Upload failed')); }
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      setProgress(60);
      logger.success('UploadForm', 'Upload complete', { id: data.id });
      addLog('File received. Starting analysis...');
      setResult(data);
      setStatus('analyzing');

      fillInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 1 : 90));
      }, 600);

      const tags = await analyzeVideo(data.gcsUri, data.id);
      clearInterval(fillInterval);
      setProgress(100);
      setResult((prev) => ({ ...prev, autoTags: tags }));
      setStatus('success');
    } catch (err) {
      if (fillInterval) clearInterval(fillInterval);
      logger.error('UploadForm', 'Process failed', { message: err.message });
      setError(err.message);
      setStatus('error');
    }
  }

  async function analyzeVideo(gcsUri, submissionId) {
    logger.info('UploadForm', 'Starting auto-tagging', { submissionId });
    addLog('Connecting to Video Intelligence API...');

    const startResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gcsUri, submissionId }),
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.error || 'Failed to start analysis');
    }

    const { operationName } = await startResponse.json();
    logger.info('UploadForm', 'Analysis started', { operationName });
    addLog(`Analysis operation started.`);

    return new Promise((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/analyze/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName, submissionId }),
          });

          if (!statusResponse.ok) {
            clearInterval(poll);
            reject(new Error('Status check failed'));
            return;
          }

          const status = await statusResponse.json();

          if (status.done) {
            clearInterval(poll);
            logger.success('UploadForm', 'Auto-tagging complete', {
              tags: status.autoTags,
            });
            addLog(`Auto-tagging complete — ${status.autoTags?.length ?? 0} tags generated.`);
            resolve(status.autoTags);
          } else {
            logger.info('UploadForm', 'Still processing...');
            addLog('Still processing...');
          }
        } catch (error) {
          clearInterval(poll);
          reject(error);
        }
      }, 5000);
    });
  }

  function handleDismiss() {
    setStatus('idle');
    setResult(null);
    setFile(null);
    setContributor('');
    setNote('');
    setInputMode('upload');
    setLogs([]);
    setProgress(0);
    setError(null);
  }

  const isProcessing = status === 'uploading' || status === 'analyzing';

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    background: '#ffffff',
    color: 'var(--color-body)',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
  };

  return (
    <>
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'var(--color-surface)',
      overflow: 'hidden',
      filter: status === 'success' ? 'blur(4px)' : 'none',
      opacity: status === 'success' ? 0.4 : 1,
      transition: 'filter 600ms ease, opacity 600ms ease',
      pointerEvents: status === 'success' ? 'none' : 'auto',
    }}>

      {/* Left panel — form controls */}
      <aside style={{
        width: '340px',
        minWidth: '340px',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        height: '100vh',
        overflowY: 'auto',
        gap: '1.25rem',
      }}>
        <div>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              color: 'var(--color-machine)',
              fontFamily: 'var(--font-dm-mono), monospace',
              textDecoration: 'none',
              marginBottom: '1rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-body)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
          >
            ← Exit
          </Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto', lineHeight: '1.2', marginBottom: '0.375rem' }}>
            Upload your movement
          </h1>
          <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
            Upload or record a video of yourself dancing. The system will auto-tag it, and you will be able to correct those tags.
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
          <button
            onClick={() => { setInputMode('upload'); setFile(null); }}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: inputMode === 'upload' ? 'var(--color-body)' : 'transparent',
              color: inputMode === 'upload' ? 'var(--color-surface)' : 'var(--color-secondary)',
            }}
          >
            Upload file
          </button>
          <button
            onClick={() => { setInputMode('record'); setFile(null); }}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: inputMode === 'record' ? 'var(--color-body)' : 'transparent',
              color: inputMode === 'record' ? 'var(--color-surface)' : 'var(--color-secondary)',
            }}
          >
            Record video
          </button>
        </div>

        {/* Context blurb */}
        <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', lineHeight: '1.6' }}>
          Any movement is welcome — dance, gesture, ritual, sport, or daily practice. Maximum 5 minutes.
        </p>

        {/* File picker — upload mode only */}
        {inputMode === 'upload' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
              Video file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '2px',
              }}>
                <span style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-body)',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}>
                  {file.name}
                </span>
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={isProcessing}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                    color: 'var(--color-machine)',
                    background: 'none',
                    border: 'none',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                  onMouseEnter={(e) => { if (!isProcessing) e.currentTarget.style.color = 'var(--color-body)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isProcessing}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1.5px solid var(--color-body)',
                  borderRadius: '2px',
                  background: 'transparent',
                  color: 'var(--color-body)',
                  cursor: 'pointer',
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
                Choose file
              </button>
            )}
          </div>
        )}

        {/* Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
            Your name <span style={{ color: 'var(--color-rejected)' }}>*</span>
          </label>
          <input
            type="text"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            placeholder="Enter your name"
            disabled={isProcessing}
            style={{ ...inputStyle, opacity: isProcessing ? 0.4 : 1, cursor: isProcessing ? 'not-allowed' : 'text' }}
            onFocus={(e) => { if (!isProcessing) e.currentTarget.style.borderColor = 'var(--color-body)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {/* Note */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
            Note about this movement <span style={{ color: 'var(--color-rejected)' }}>*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the tradition, context, and meaning of this movement. Be specific — this information will be reviewed by community members."
            rows={4}
            disabled={isProcessing}
            style={{ ...inputStyle, opacity: isProcessing ? 0.4 : 1, cursor: isProcessing ? 'not-allowed' : 'text', resize: 'none' }}
            onFocus={(e) => { if (!isProcessing) e.currentTarget.style.borderColor = 'var(--color-body)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {/* Progress bar — upload + analysis */}
        {(status === 'uploading' || status === 'analyzing') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '2px', height: '2px' }}>
              <div style={{ backgroundColor: 'var(--color-body)', height: '2px', borderRadius: '2px', width: `${progress}%`, transition: 'width 600ms ease' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace' }}>
              {progress}% — {status === 'uploading' ? 'uploading' : 'analysing'}
            </p>
          </div>
        )}

        {/* Log terminal — uploading + analysing */}
        {(status === 'uploading' || status === 'analyzing') && logs.length > 0 && (
          <div style={{
            backgroundColor: '#EFEFEF',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            padding: '0.625rem 0.75rem',
            maxHeight: '7rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}>
            {logs.map((log) => (
              <p key={log.id} style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace', lineHeight: '1.4', margin: 0 }}>
                <span style={{ color: 'var(--color-machine)', marginRight: '0.5rem', userSelect: 'none' }}>›</span>
                {log.message}
              </p>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {error && <p style={{ fontSize: '0.875rem', color: 'var(--color-rejected)' }}>{error}</p>}

        {/* Upload button — pinned to bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button
            onClick={handleUpload}
            disabled={isProcessing || !file}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--color-body)',
              fontSize: '0.875rem',
              fontWeight: '500',
              fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1.5px solid var(--color-body)',
              borderRadius: '2px',
              cursor: isProcessing || !file ? 'not-allowed' : 'pointer',
              opacity: isProcessing || !file ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessing && file) {
                e.currentTarget.style.backgroundColor = 'var(--color-body)';
                e.currentTarget.style.color = 'var(--color-surface)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-body)';
            }}
          >
            {status === 'uploading'
              ? 'Uploading...'
              : status === 'analyzing'
              ? 'Analysing...'
              : 'Upload video'}
          </button>
        </div>
      </aside>

      {/* Right panel — video area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>

        {/* Upload mode — no file: placeholder */}
        {inputMode === 'upload' && !file && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Select a video file to preview it here.
            </p>
          </div>
        )}

        {/* Upload mode — file selected: large preview */}
        {inputMode === 'upload' && file && (
          <video
            src={fileURL}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
          />
        )}

        {/* Record mode — no file: VideoRecorder fills panel */}
        {inputMode === 'record' && !file && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'hidden' }}>
            <VideoRecorder onRecordingComplete={handleRecordingComplete} />
          </div>
        )}

        {/* Record mode — recording accepted: large preview + record again */}
        {inputMode === 'record' && file && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <video
              src={fileURL}
              controls
              style={{ flex: 1, width: '100%', objectFit: 'contain', backgroundColor: '#000' }}
            />
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setFile(null)}
                style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}
              >
                Record again
              </button>
            </div>
          </div>
        )}

      </main>
    </div>

    {/* Success popup */}
    <AnimatePresence>
    {status === 'success' && result && (
      <motion.div
        key="success"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(18, 16, 14, 0.7)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div style={{
          position: 'relative',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '2px',
          padding: '2rem',
          maxWidth: '22rem',
          width: '100%',
        }}>
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-machine)',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0.25rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-body)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
            aria-label="Dismiss"
          >
            ✕
          </button>
          <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-dm-mono), monospace', color: 'var(--color-machine)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Complete
          </p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto', marginBottom: '0.5rem' }}>
            Submission received
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            Your video has been submitted for community review.
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace', marginBottom: '1.5rem' }}>
            ID: {result.id}
          </p>
          <a
            href={`/submission/${result.id}`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.625rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--color-body)',
              fontSize: '0.875rem',
              fontWeight: '500',
              fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1.5px solid var(--color-body)',
              borderRadius: '2px',
              textDecoration: 'none',
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
            View submission &#8594;
          </a>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
    </>
  );
}
