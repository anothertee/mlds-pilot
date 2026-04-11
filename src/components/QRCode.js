'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url }) {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div
        className="state-surface"
        style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#ffffff' }}
      >
        <QRCodeSVG
          value={url}
          size={180}
          bgColor="#ffffff"
          fgColor="#111111"
          level="M"
        />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', textAlign: 'center' }}>
        Scan to save this submission to your phone
      </p>
    </div>
  );
}
