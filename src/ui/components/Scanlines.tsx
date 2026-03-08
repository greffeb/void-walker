// ---------------------------------------------------------------------------
// src/ui/components/Scanlines.tsx — CRT scanlines overlay (mockup aesthetic)
// ---------------------------------------------------------------------------

export function Scanlines(): JSX.Element {
  return (
    <>
      {/* Scanlines — static horizontal lines matching mockup */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
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
