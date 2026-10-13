export function getLoginPointerOffset(event, rect) {
  if (!rect?.width || !rect?.height) return { x: 0, y: 0 }
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = ((event.clientY - rect.top) / rect.height) * 2 - 1
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
  }
}

export function shouldEnableLoginParallax({ pointer, reducedMotion }) {
  return pointer === 'fine' && !reducedMotion
}
