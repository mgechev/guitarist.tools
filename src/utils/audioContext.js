let sharedContext = null;

export function getSharedAudioContext() {
  if (!sharedContext) {
    sharedContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedContext;
}
