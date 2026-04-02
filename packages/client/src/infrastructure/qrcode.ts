import QRCode from 'qrcode';

export async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 200, margin: 2 });
}

export function roomJoinURL(roomCode: string): string {
  return `${window.location.origin}/?room=${roomCode}`;
}
