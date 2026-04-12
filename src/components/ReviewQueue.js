'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import TagDisplay from '@/components/TagDisplay';

export default function ReviewQueue({
  reviewerPassword,
  status = 'auto_tagged',
  onDecision,
  readOnly = false,
}) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [tagInputs, setTagInputs] = useState({});
  const [detailSubmission, setDetailSubmission] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/submissions?status=${status}`,
        { headers: { 'x-reviewer-password': reviewerPassword } }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions);
      logger.info('ReviewQueue', 'Queue loaded', {
        status,
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
  }, [reviewerPassword, status]);

  useEffect(() => {
    fetchSubmissions();
    setDetailSubmission(null);
  }, [fetchSubmissions]);

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
          humanTags: tags[submissionId] || [],
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

      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setDetailSubmission(null);
      if (onDecision) onDecision();
    } catch (err) {
      logger.error('ReviewQueue', 'Decision failed', { message: err.message });
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }

  function addTag(submissionId) {
    const input = tagInputs[submissionId];
    if (!input?.label) return;

    const currentTags = tags[submissionId] || [];
    if (currentTags.length >= 5) return;

    setTags((prev) => ({
      ...prev,
      [submissionId]: [
        ...currentTags,
        { label: input.label, meaning: input.meaning || '' },
      ],
    }));

    setTagInputs((prev) => ({
      ...prev,
      [submissionId]: { label: '', meaning: '' },
    }));

    logger.info('ReviewQueue', 'Tag added', { submissionId, label: input.label });
  }

  function removeTag(submissionId, index) {
    setTags((prev) => ({
      ...prev,
      [submissionId]: (prev[submissionId] || []).filter((_, i) => i !== index),
    }));
  }

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    background: '#ffffff',
    color: 'var(--color-body)',
    outline: 'none',
    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
  };

  function statusColor(s) {
    switch (s) {
      case 'approved': return 'var(--color-approved)';
      case 'rejected': return 'var(--color-rejected)';
      case 'restricted':
      case 'auto_tagged': return 'var(--color-accent)';
      default: return 'var(--color-machine)';
    }
  }

  if (loading) {
    return (
      <p className="state-breathing" style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace' }}>Loading...</p>
    );
  }

  if (error) {
    return <p style={{ fontSize: '0.875rem', color: 'var(--color-rejected)' }}>{error}</p>;
  }

  if (submissions.length === 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
        No submissions with this status.
      </p>
    );
  }

  // — Detail view —
  if (detailSubmission) {
    const s = detailSubmission;
    const isProcessingDetail = processing === s.id;

    return (
      <div className="page-enter" style={{ maxWidth: '640px' }}>

        {/* Back + ID row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => setDetailSubmission(null)}
            style={{ fontSize: '0.75rem', fontFamily: 'var(--font-dm-mono), monospace', color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-body)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-secondary)'; }}
          >
            &#8592; Back to queue
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
            {s.id}
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto', marginBottom: '0.5rem' }}>
            {s.filename}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
              {s.contributor} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Unknown date'}
            </p>
            <span style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: `1px solid ${statusColor(s.status)}`,
              borderRadius: '2px',
              padding: '0.125rem 0.5rem',
              color: statusColor(s.status),
              background: 'transparent',
            }}>
              {s.status}
            </span>
          </div>
        </div>

        {/* Video player */}
        <div style={{ marginBottom: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '2px', overflow: 'hidden', backgroundColor: '#000' }}>
          <video
            src={`/api/download?submissionId=${s.id}&inline=true`}
            controls
            style={{ width: '100%', maxHeight: '360px', display: 'block' }}
          />
        </div>

        {/* Contributor note */}
        {s.note && (
          <div style={{ padding: '0.875rem', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Contributor note
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-body)', lineHeight: '1.6' }}>{s.note}</p>
          </div>
        )}

        {/* Machine vs Community tags */}
        <div style={{ marginBottom: '1.5rem' }}>
          <TagDisplay
            autoTags={s.autoTags || []}
            humanTags={readOnly ? (s.humanTags || []) : (tags[s.id] || [])}
          />
        </div>

        {/* Reviewer note — read-only tabs */}
        {readOnly && s.reviewerNote && (
          <div style={{ padding: '0.875rem', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Reviewer note
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-body)', lineHeight: '1.6' }}>{s.reviewerNote}</p>
          </div>
        )}

        {/* Review form — pending tab */}
        {!readOnly && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>
                Reviewer note (optional)
              </label>
              <textarea
                value={notes[s.id] || ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                placeholder="Add context or reason for decision..."
                rows={2}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)' }}>
                  Cultural annotations
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
                  {(tags[s.id] || []).length}/5
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                A useful tag names the specific tradition, gesture, or meaning — e.g. &ldquo;Caribbean harvest gesture — welcoming abundance&rdquo;.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {(tags[s.id] || []).map((tag, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--color-community)', borderRadius: '2px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-community)', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag.label}</p>
                      {tag.meaning && <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.125rem' }}>{tag.meaning}</p>}
                    </div>
                    <button
                      onClick={() => removeTag(s.id, i)}
                      style={{ fontSize: '0.75rem', color: 'var(--color-machine)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-rejected)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {(tags[s.id] || []).length < 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <input
                    type="text"
                    placeholder="Tag label e.g. Caribbean harvest gesture"
                    value={tagInputs[s.id]?.label || ''}
                    onChange={(e) => setTagInputs((prev) => ({ ...prev, [s.id]: { ...prev[s.id], label: e.target.value } }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  />
                  <input
                    type="text"
                    placeholder="Meaning e.g. welcoming abundance from the earth"
                    value={tagInputs[s.id]?.meaning || ''}
                    onChange={(e) => setTagInputs((prev) => ({ ...prev, [s.id]: { ...prev[s.id], meaning: e.target.value } }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  />
                  <button
                    onClick={() => addTag(s.id)}
                    disabled={!tagInputs[s.id]?.label}
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: '1.5px solid var(--color-community)',
                      borderRadius: '2px',
                      background: 'transparent',
                      color: 'var(--color-community)',
                      cursor: !tagInputs[s.id]?.label ? 'not-allowed' : 'pointer',
                      opacity: !tagInputs[s.id]?.label ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (tagInputs[s.id]?.label) {
                        e.currentTarget.style.backgroundColor = 'var(--color-community)';
                        e.currentTarget.style.color = 'var(--color-surface)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-community)';
                    }}
                  >
                    Add tag
                  </button>
                </div>
              )}
            </div>

            {/* Decision buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { label: 'Approve', decision: 'approved', color: 'var(--color-approved)', textOnFill: 'var(--color-ink)' },
                { label: 'Restrict', decision: 'restricted', color: 'var(--color-accent)', textOnFill: 'var(--color-surface)' },
                { label: 'Reject', decision: 'rejected', color: 'var(--color-rejected)', textOnFill: 'var(--color-surface)' },
              ].map(({ label, decision, color, textOnFill }) => (
                <button
                  key={decision}
                  onClick={() => handleDecision(s.id, decision)}
                  disabled={isProcessingDetail}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: `1.5px solid ${color}`,
                    borderRadius: '2px',
                    background: 'transparent',
                    color: color,
                    cursor: isProcessingDetail ? 'not-allowed' : 'pointer',
                    opacity: isProcessingDetail ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingDetail) {
                      e.currentTarget.style.backgroundColor = color;
                      e.currentTarget.style.color = textOnFill;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = color;
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // — Queue list —
  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
      {submissions.map((submission) => (
        <motion.div
          key={submission.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ border: '1px solid var(--color-border)', borderRadius: '2px', padding: '1rem', backgroundColor: '#ffffff' }}
        >
          <div className="flex items-start justify-between" style={{ marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', marginBottom: '0.125rem', fontFamily: 'var(--font-dm-mono), monospace' }}>{submission.id}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-body)' }}>
                {submission.filename}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.125rem' }}>
                {submission.contributor} ·{' '}
                {submission.createdAt
                  ? new Date(submission.createdAt).toLocaleDateString()
                  : 'Unknown date'}
              </p>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: `1px solid ${statusColor(submission.status)}`,
              borderRadius: '2px',
              padding: '0.25rem 0.5rem',
              color: statusColor(submission.status),
              background: 'transparent',
            }}>
              {submission.status}
            </span>
          </div>

          {submission.note && (
            <div style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '1rem', background: 'transparent' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>
                Contributor note
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-body)' }}>{submission.note}</p>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Auto-generated tags
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {submission.autoTags?.map((tag, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{
                    color: 'var(--color-machine)',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid var(--color-machine)',
                    borderRadius: '2px',
                    padding: '0.125rem 0.375rem',
                    background: 'transparent',
                  }}>{tag.label}</span>
                  <span style={{ color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
                    {(tag.score * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {readOnly && submission.humanTags?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Community annotations
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {submission.humanTags.map((tag, i) => (
                  <li key={i} style={{ padding: '0.5rem', border: '1px solid var(--color-community)', borderRadius: '2px', background: 'transparent' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-community)', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag.label}</p>
                    {tag.meaning && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.125rem' }}>{tag.meaning}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {readOnly && submission.reviewerNote && (
            <div style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '1rem', background: 'transparent' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>
                Reviewer note
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-body)' }}>{submission.reviewerNote}</p>
            </div>
          )}

          {!readOnly && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>
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
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)' }}>
                    Cultural annotations
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
                    {(tags[submission.id] || []).length}/5
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                  A useful tag names the specific tradition, gesture, or meaning.
                  For example: &ldquo;Caribbean harvest gesture — welcoming abundance&rdquo;
                  or &ldquo;Yoruba greeting bow — showing respect to elders&rdquo;. Avoid
                  generic labels like &ldquo;dance&rdquo; or &ldquo;movement&rdquo;.
                </p>
                <div className="space-y-2">
                  {(tags[submission.id] || []).map((tag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--color-community)', borderRadius: '2px', background: 'transparent' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-community)', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag.label}</p>
                        {tag.meaning && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>{tag.meaning}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeTag(submission.id, i)}
                        style={{ fontSize: '0.75rem', color: 'var(--color-machine)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-rejected)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                {(tags[submission.id] || []).length < 5 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input
                      type="text"
                      placeholder="Tag label e.g. Caribbean harvest gesture"
                      value={tagInputs[submission.id]?.label || ''}
                      onChange={(e) =>
                        setTagInputs((prev) => ({
                          ...prev,
                          [submission.id]: {
                            ...prev[submission.id],
                            label: e.target.value,
                          },
                        }))
                      }
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    />
                    <input
                      type="text"
                      placeholder="Meaning e.g. welcoming abundance from the earth"
                      value={tagInputs[submission.id]?.meaning || ''}
                      onChange={(e) =>
                        setTagInputs((prev) => ({
                          ...prev,
                          [submission.id]: {
                            ...prev[submission.id],
                            meaning: e.target.value,
                          },
                        }))
                      }
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    />
                    <button
                      onClick={() => addTag(submission.id)}
                      disabled={!tagInputs[submission.id]?.label}
                      style={{
                        width: '100%',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: '1.5px solid var(--color-community)',
                        borderRadius: '2px',
                        background: 'transparent',
                        color: 'var(--color-community)',
                        cursor: !tagInputs[submission.id]?.label ? 'not-allowed' : 'pointer',
                        opacity: !tagInputs[submission.id]?.label ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (tagInputs[submission.id]?.label) {
                          e.currentTarget.style.backgroundColor = 'var(--color-community)';
                          e.currentTarget.style.color = 'var(--color-surface)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-community)';
                      }}
                    >
                      Add tag
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleDecision(submission.id, 'approved')}
                  disabled={processing === submission.id}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1.5px solid var(--color-approved)',
                    borderRadius: '2px',
                    background: 'transparent',
                    color: 'var(--color-approved)',
                    cursor: processing === submission.id ? 'not-allowed' : 'pointer',
                    opacity: processing === submission.id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (processing !== submission.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-approved)';
                      e.currentTarget.style.color = 'var(--color-ink)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-approved)';
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(submission.id, 'restricted')}
                  disabled={processing === submission.id}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1.5px solid var(--color-accent)',
                    borderRadius: '2px',
                    background: 'transparent',
                    color: 'var(--color-accent)',
                    cursor: processing === submission.id ? 'not-allowed' : 'pointer',
                    opacity: processing === submission.id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (processing !== submission.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                      e.currentTarget.style.color = 'var(--color-surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }}
                >
                  Restrict
                </button>
                <button
                  onClick={() => handleDecision(submission.id, 'rejected')}
                  disabled={processing === submission.id}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1.5px solid var(--color-rejected)',
                    borderRadius: '2px',
                    background: 'transparent',
                    color: 'var(--color-rejected)',
                    cursor: processing === submission.id ? 'not-allowed' : 'pointer',
                    opacity: processing === submission.id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (processing !== submission.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-rejected)';
                      e.currentTarget.style.color = 'var(--color-surface)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-rejected)';
                  }}
                >
                  Reject
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setDetailSubmission(submission)}
            style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-machine)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-mono), monospace' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-body)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
          >
            View full submission &#8594;
          </button>
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}
