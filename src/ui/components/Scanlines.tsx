// ---------------------------------------------------------------------------
// src/ui/components/Scanlines.tsx — CRT scanlines overlay
// ---------------------------------------------------------------------------

export function Scanlines(): JSX.Element {
  return (
    <>
      <div
        className="animate-scanlines"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: '-10%', /* Oversize to prevent showing edges during animation */
          width: '120%',
          height: '120%',
          pointerEvents: 'none',
          zIndex: 9998,
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(0, 0, 0, 0.3) 2px,
            rgba(0, 0, 0, 0.3) 4px
          )`,
          opacity: 0.6,
        }}
      />
      {/* Vignette effect */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          background: 'radial-gradient(circle, transparent 50%, rgba(0, 0, 0, 0.3) 100%)',
          boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 0.5)',
        }}
      />
    </>
  );
}
