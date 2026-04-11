'use client';

import { useState } from 'react';
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
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
        Upload your movement
      </h1>
      <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}>
        Upload or record a video of yourself dancing. The system will
        auto-tag it, and you will be able to correct those tags.
      </p>

      <div className="space-y-4">
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
            {file && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
                  Preview
                </label>
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '2px', height: '12rem', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        )}

        {inputMode === 'record' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
              Webcam
            </label>
            {file ? (
              <div className="space-y-2">
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '2px', height: '12rem', objectFit: 'cover' }}
                />
                <button
                  onClick={() => setFile(null)}
                  style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Record again
                </button>
              </div>
            ) : (
              <VideoRecorder onRecordingComplete={handleRecordingComplete} />
            )}
          </div>
        )}

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

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.25rem' }}>
            Note about this movement <span style={{ color: 'var(--color-rejected)' }}>*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the tradition, context, and meaning of this movement. Be specific — this information will be reviewed by community members."
            rows={3}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {status === 'uploading' && (
          <div className="space-y-1">
            <div style={{ width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '2px', height: '2px' }}>
              <div
                style={{ backgroundColor: 'var(--color-body)', height: '2px', borderRadius: '2px', width: `${progress}%`, transition: 'width 300ms ease' }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace' }}>{progress}% uploaded</p>
          </div>
        )}

        {status === 'analyzing' && (
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '2px', background: 'transparent' }}>
            <p className="state-breathing" style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
              Analysing movement... this may take 20-30 seconds.
            </p>
          </div>
        )}

        {error && <p style={{ fontSize: '0.875rem', color: 'var(--color-rejected)' }}>{error}</p>}

        {status === 'success' && result && (
          <div className="page-enter" style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '2px', background: 'transparent' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)', marginBottom: '0.5rem' }}>
              Upload complete
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace', marginBottom: '0.5rem' }}>
              Submission ID: {result.id}
            </p>

            <a
              href={`/submission/${result.id}`}
              style={{ fontSize: '0.75rem', color: 'var(--color-body)', textDecoration: 'underline', display: 'block', marginBottom: '0.5rem' }}
            >
              View submission &#8594;
            </a>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
              Your video has been submitted for community review.
            </p>
          </div>
        )}

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
    </div>
  );
}
