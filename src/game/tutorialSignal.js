// Shared mutable signal — written by TutorialOverlay, read by pool useFrame loops.
// Using a plain object avoids React state churn inside the game loop.
export const tutorialSignal = {
  clearObstacles: false,  // BarricadePool: deactivate all active barricades on next frame
}
