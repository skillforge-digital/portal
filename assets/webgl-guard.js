(function () {
  if (typeof window === 'undefined') return;
  if (typeof window.__SF_WEBGL_OK === 'boolean') return;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    window.__SF_WEBGL_OK = !!gl;
  } catch (e) {
    window.__SF_WEBGL_OK = false;
  }
})();

