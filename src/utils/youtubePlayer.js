let playerApiPromise;

export const loadYouTubePlayerApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (playerApiPromise) return playerApiPromise;

  playerApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    window.onYouTubeIframeAPIReady = () => {
      window.onYouTubeIframeAPIReady = previousCallback || undefined;
      try {
        previousCallback?.();
      } catch (error) {
        console.error('Existing YouTube player callback failed:', error);
      }
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube player API did not initialize'));
    };
    script.onerror = () => {
      window.onYouTubeIframeAPIReady = previousCallback || undefined;
      playerApiPromise = null;
      reject(new Error('Unable to load YouTube player API'));
    };
    document.head.appendChild(script);
  });

  return playerApiPromise;
};
