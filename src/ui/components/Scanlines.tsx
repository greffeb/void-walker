// ---------------------------------------------------------------------------
// src/ui/components/Scanlines.tsx — CRT scanlines overlay
// ---------------------------------------------------------------------------

export function Scanlines(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        background: `repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 2px,
          rgba(0, 0, 0, 0.12) 2px,
          rgba(0, 0, 0, 0.12) 3px
        )`,
        opacity: 0.3,
      }}
    />
  );
}
