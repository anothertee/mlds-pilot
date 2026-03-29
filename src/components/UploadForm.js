'use client';

import { useState } from 'react';
import { uploadVideo } from '@/lib/uploadVideo';
import { logger } from '@/lib/logger';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [contributor, setContributor] = useState('');
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  async function handleUpload() {
    if (!file) {
      logger.warn('UploadForm', 'Upload attempted with no file selected');
      setError('Please select a video file first.');
      return;
    }
  
    logger.info('UploadForm', 'Upload initiated', {
      filename: file.name,
      contributor: contributor || 'anonymous',
    });
  
    setStatus('uploading');
    setError(null);
  
    try {
      const data = await uploadVideo(file, contributor, note, (p) => setProgress(p));
      logger.success('UploadForm', 'Upload complete', { id: data.id });
      setResult(data);
      setStatus('success');
    } catch (err) {
      logger.error('UploadForm', 'Upload failed', { message: err.message });
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Upload your movement</h1>
      <p className="text-gray-500 text-sm">
        Upload a video of yourself dancing. The system will auto-tag it, and you will be able to correct those tags.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video file</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        {file && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
            <video src={URL.createObjectURL(file)} controls className="w-full rounded border border-gray-200" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name (optional)</label>
          <input
            type="text"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            placeholder="Anonymous"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note about this movement (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What tradition does this belong to? What is the context?"
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        {status === 'uploading' && (
          <div className="space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-gray-800 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-500">{progress}% uploaded</p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {status === 'success' && (
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Upload complete</p>
            <p className="text-xs text-gray-500 mt-1">Submission ID: {result.id}</p>
            <p className="text-xs text-gray-500">Your video has been submitted for review. Auto-tagging will begin shortly.</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={status === 'uploading' || !file}
          className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'uploading' ? 'Uploading...' : 'Upload video'}
        </button>
      </div>
    </div>
  );
}