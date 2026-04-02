import { useEffect, useState } from 'react';
import { generateQRDataURL, roomJoinURL } from '@/infrastructure/qrcode';

interface RoomQRCodeProps {
  roomCode: string;
}

export function RoomQRCode({ roomCode }: RoomQRCodeProps) {
  const [dataUrl, setDataUrl] = useState('');
  const joinUrl = roomJoinURL(roomCode);

  useEffect(() => {
    generateQRDataURL(joinUrl).then(setDataUrl);
  }, [joinUrl]);

  if (!dataUrl) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <img src={dataUrl} alt={`掃描加入：${roomCode}`} width={200} height={200} />
      <p className="text-sm text-muted-foreground">掃描 QR Code 加入房間</p>
    </div>
  );
}
