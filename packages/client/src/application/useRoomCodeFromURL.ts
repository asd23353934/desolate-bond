export function useRoomCodeFromURL(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('room') ?? '';
}
