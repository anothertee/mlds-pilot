'use client';

export default function TagDisplay({ autoTags = [], humanTags = [] }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Machine says
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Google Video Intelligence
          </p>
        </div>
        {autoTags.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No tags yet</p>
        ) : (
          <ul className="space-y-2">
            {autoTags.map((tag, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{tag.label}</span>
                <span className="text-xs text-gray-400 ml-4">
                  {(tag.score * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Community says
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Reviewed and approved
          </p>
        </div>
        {humanTags.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Pending community review
          </p>
        ) : (
          <ul className="space-y-2">
            {humanTags.map((tag, i) => (
              <li key={i}>
                <span className="text-sm text-gray-700">{tag.label}</span>
                {tag.meaning && (
                  <p className="text-xs text-gray-400 mt-0.5">{tag.meaning}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}