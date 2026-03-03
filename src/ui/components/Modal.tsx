// ---------------------------------------------------------------------------
// src/ui/components/Modal.tsx — Shared full-screen modal container
// ---------------------------------------------------------------------------

interface ModalProps {
  readonly title: string;
  readonly icon: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}

export function Modal({ title, icon, onClose, children }: ModalProps): JSX.Element {
  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--amber-dim)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          className="btn-console"
          onClick={onClose}
          style={{ padding: '6px 12px', fontSize: '11px' }}
        >
          ✕ FERMER
        </button>
        <span
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '12px',
            letterSpacing: '0.1em',
            color: 'var(--amber-glow)',
          }}
        >
          {icon} {title}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </div>
    </div>
  );
}
