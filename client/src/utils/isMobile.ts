export function isMobile(): boolean {
  // UA-based detection for real mobile devices
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  // Touch device with narrow viewport (e.g. tablets in portrait)
  if (navigator.maxTouchPoints > 0 && window.innerWidth < 768) return true;
  return false;
}
