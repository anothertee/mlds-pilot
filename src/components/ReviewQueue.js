'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function ReviewQueue({ reviewerPassword }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [notes, setNotes] = useState({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    try {
      const response = await fetch(
        `/api/submissions?reviewerPassword=${reviewerPassword}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions);
      logger.info('ReviewQueue', 'Queue loaded', {
        count: data.submissions.length,
      });
    } catch (err) {
      logger.error('ReviewQueue', 'Failed to load queue', {
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(submissionId, decision) {
    setProcessing(submissionId);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          decision,
          note: notes[submissionId] || '',
          reviewerPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Review request failed');
      }

      logger.success('ReviewQueue', 'Decision submitted', {
        submissionId,
        decision,
      });

      setSubmissions((prev) =>
        prev.filter((s) => s.id !== submissionId)
      );
    } catch (err) {
      logger.error('ReviewQueue', 'Decision failed', { message: err.message });
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500 animate-pulse">
        Loading queue...
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No submissions pending review.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="border border-gray-200 rounded p-4 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">
                {submission.id}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {submission.filename}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {submission.contributor} ·{' '}
                {submission.createdAt
                  ? new Date(submission.createdAt).toLocaleDateString()
                  : 'Unknown date'}
              </p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {submission.status}
            </span>
          </div>

          {submission.note && (
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Contributor note
              </p>
              <p className="text-xs text-gray-700">{submission.note}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Auto-generated tags
            </p>
            <ul className="space-y-1">
              {submission.autoTags?.map((tag, i) => (
                <li key={i} className="flex justify-between text-xs">
                  <span className="text-gray-700">{tag.label}</span>
                  <span className="text-gray-400">
                    {(tag.score * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Reviewer note (optional)
            </label>
            <textarea
              value={notes[submission.id] || ''}
              onChange={(e) =>
                setNotes((prev) => ({
                  ...prev,
                  [submission.id]: e.target.value,
                }))
              }
              placeholder="Add context or reason for decision..."
              rows={2}
              className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDecision(submission.id, 'approved')}
              disabled={processing === submission.id}
              className="flex-1 py-2 px-3 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleDecision(submission.id, 'restricted')}
              disabled={processing === submission.id}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Restrict
            </button>
            <button
              onClick={() => handleDecision(submission.id, 'rejected')}
              disabled={processing === submission.id}
              className="flex-1 py-2 px-3 bg-white text-gray-500 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reject
            </button>
          </div>

          <a
            href={`/submission/${submission.id}`}
            className="block text-xs text-gray-400 hover:text-gray-600"
          >
            View full submission &#8594;
          </a>
        </div>
      ))}
    </div>
  );
}