const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字元 O/0/1/I

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function generateUniqueCode(isActive: (code: string) => boolean, maxRetries = 10): string {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRoomCode();
    if (!isActive(code)) return code;
  }
  throw new Error('ROOM_CODE_EXHAUSTED');
}
