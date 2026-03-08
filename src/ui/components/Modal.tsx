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
        background: 'var(--bg-deep)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '2px solid var(--amber-glow)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '28px',
            letterSpacing: '0.1em',
            color: 'var(--amber-glow)',
            textTransform: 'uppercase',
          }}
        >
          {icon} {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '2px solid var(--amber-dim)',
            color: 'var(--amber-dim)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            padding: '2px 10px',
            transition: 'all 100ms',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-glow)';
            (e.target as HTMLButtonElement).style.color = 'var(--amber-glow)';
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.borderColor = 'var(--amber-dim)';
            (e.target as HTMLButtonElement).style.color = 'var(--amber-dim)';
          }}
        >
          [X] FERMER
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </div>
    </div>
  );
}
