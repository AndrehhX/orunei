export function isFinePointer({ pointer = 'coarse', reducedMotion = false } = {}) {
  return pointer === 'fine' && !reducedMotion
}

export function cursorState({ pointer = 'coarse', reducedMotion = false, interactive = false, pressed = false } = {}) {
  return {
    enabled: isFinePointer({ pointer, reducedMotion }),
    interactive: Boolean(interactive),
    pressed: Boolean(pressed),
  }
}
