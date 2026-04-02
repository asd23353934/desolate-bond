/** Input sent by the client each frame. Server is the authoritative source — clients never mutate game state directly. */
export interface PlayerInput {
  dx: number;   // -1 | 0 | 1  (left / none / right)
  dy: number;   // -1 | 0 | 1  (up / none / down)
  rescue: boolean;
}
