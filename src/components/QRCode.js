'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url }) {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <QRCodeSVG
          value={url}
          size={180}
          bgColor="#ffffff"
          fgColor="#111111"
          level="M"
        />
      </div>
      <p className="text-xs text-gray-500 text-center">
        Scan to save this submission to your phone
      </p>
    </div>
  );
}