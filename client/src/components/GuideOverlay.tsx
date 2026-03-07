export function GuideOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Semi-transparent mask outside the circle */}
      <defs>
        <mask id="guide-mask">
          <rect width="100" height="100" fill="white" />
          <circle cx="50" cy="50" r="35" fill="black" />
        </mask>
      </defs>
      <rect
        width="100"
        height="100"
        fill="black"
        fillOpacity="0.3"
        mask="url(#guide-mask)"
      />

      {/* Guide circle */}
      <circle
        cx="50"
        cy="50"
        r="35"
        fill="none"
        stroke="white"
        strokeWidth="0.3"
        strokeOpacity="0.8"
      />

      {/* Crosshair - horizontal */}
      <line
        x1="10"
        y1="50"
        x2="45"
        y2="50"
        stroke="white"
        strokeWidth="0.15"
        strokeOpacity="0.6"
      />
      <line
        x1="55"
        y1="50"
        x2="90"
        y2="50"
        stroke="white"
        strokeWidth="0.15"
        strokeOpacity="0.6"
      />

      {/* Crosshair - vertical */}
      <line
        x1="50"
        y1="10"
        x2="50"
        y2="45"
        stroke="white"
        strokeWidth="0.15"
        strokeOpacity="0.6"
      />
      <line
        x1="50"
        y1="55"
        x2="50"
        y2="90"
        stroke="white"
        strokeWidth="0.15"
        strokeOpacity="0.6"
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="0.5" fill="white" fillOpacity="0.8" />
    </svg>
  );
}
