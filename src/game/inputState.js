// Module-level input state.
// Written by usePlayerInput (DOM event handlers), read by BulletPool in useFrame.
// Using a plain object avoids React state churn inside the game loop.
export const inputState = {
  shootPressed: false,
}
