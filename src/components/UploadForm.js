'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!file) {
      setFileURL(null);
      return;
    }
    const url = fileURL;
    setFileURL(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('video/')) {
      setFile(selected);
      setError(null);
    } else {
      setError('Please select a video file.');
      setFile(null);
    }
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

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contributor', contributor);
      formData.append('note', note);

      setProgress(25);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await uploadResponse.json();
      setProgress(100);

      logger.success('UploadForm', 'Upload complete', { id: data.id });
      setResult(data);
      setStatus('analyzing');

      const tags = await analyzeVideo(data.gcsUri, data.id);
      setResult((prev) => ({ ...prev, autoTags: tags }));
      setStatus('success');
    } catch (err) {
      logger.error('UploadForm', 'Process failed', { message: err.message });
      setError(err.message);
      setStatus('error');
    }
  }

  async function analyzeVideo(gcsUri, submissionId) {
    logger.info('UploadForm', 'Starting auto-tagging', { submissionId });

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
            resolve(status.autoTags);
          } else {
            logger.info('UploadForm', 'Still processing...');
          }
        } catch (error) {
          clearInterval(poll);
          reject(error);
        }
      }, 5000);
    });
  }

  const isProcessing = status === 'uploading' || status === 'analyzing';

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    background: 'transparent',
    color: 'var(--color-body)',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
  };

  return (
    <>
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>

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

        {/* File picker — upload mode only */}
        {inputMode === 'upload' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
              Video file
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'block', width: '100%', fontSize: '0.875rem', color: 'var(--color-secondary)' }}
            />
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
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
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
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {/* Progress */}
        {status === 'uploading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '2px', height: '2px' }}>
              <div style={{ backgroundColor: 'var(--color-body)', height: '2px', borderRadius: '2px', width: `${progress}%`, transition: 'width 300ms ease' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace' }}>{progress}% uploaded</p>
          </div>
        )}

        {/* Analysing */}
        {status === 'analyzing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>Analysing movement...</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>20–30s</p>
            </div>
            <div style={{ width: '100%', height: '2px', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div className="state-analyzing" style={{ width: '25%', height: '100%', backgroundColor: 'var(--color-body)', borderRadius: '2px' }} />
            </div>
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
    {status === 'success' && result && (
      <div
        className="page-enter"
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
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '2px',
          padding: '2rem',
          maxWidth: '22rem',
          width: '100%',
        }}>
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
      </div>
    )}
    </>
  );
}
