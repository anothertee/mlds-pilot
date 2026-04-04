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

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Upload your movement
      </h1>
      <p className="text-gray-500 text-sm">
        Upload or record a video of yourself dancing. The system will
        auto-tag it, and you will be able to correct those tags.
      </p>

      <div className="space-y-4">
        <div className="flex border border-gray-200 rounded overflow-hidden">
          <button
            onClick={() => { setInputMode('upload'); setFile(null); }}
            disabled={isProcessing}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              inputMode === 'upload'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Upload file
          </button>
          <button
            onClick={() => { setInputMode('record'); setFile(null); }}
            disabled={isProcessing}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              inputMode === 'record'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Record video
          </button>
        </div>

        {inputMode === 'upload' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video file
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {file && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview
                </label>
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full rounded border border-gray-200 h-48 object-cover"
                />
              </div>
            )}
          </div>
        )}

        {inputMode === 'record' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webcam
            </label>
            {file ? (
              <div className="space-y-2">
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full rounded border border-gray-200 h-48 object-cover"
                />
                <button
                  onClick={() => setFile(null)}
                  className="text-xs text-gray-500 underline hover:text-gray-700"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            placeholder="Enter your name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note about this movement <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the tradition, context, and meaning of this movement. Be specific — this information will be reviewed by community members."
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        {status === 'uploading' && (
          <div className="space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gray-800 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{progress}% uploaded</p>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-500 animate-pulse">
              Analysing movement... this may take 20-30 seconds.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {status === 'success' && result && (
          <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Upload complete
            </p>
            <p className="text-xs text-gray-500">
              Submission ID: {result.id}
            </p>
            
            <a
              href={`/submission/${result.id}`}
              className="text-xs text-gray-700 underline hover:text-gray-900"
            >
              View submission &#8594;
            </a>
            <p className="text-xs text-gray-500">
              Your video has been submitted for community review.
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={isProcessing || !file}
          className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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