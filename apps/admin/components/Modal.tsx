import { ReactNode, useEffect } from 'react';

interface ModalProps {
  title: string;
  error?: string | null;
  wide?: boolean;
  extraWide?: boolean;
  onClose: () => void;
  children: ReactNode;
}

const modalStack: symbol[] = [];

export default function Modal({
  title,
  error,
  wide,
  extraWide,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    const id = Symbol('modal');
    modalStack.push(id);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && modalStack[modalStack.length - 1] === id) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      modalStack.splice(modalStack.indexOf(id), 1);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`flex max-h-full w-full flex-col bg-brand-sidebar text-white shadow-2xl ${extraWide ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-md'}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/20 px-6 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            className="text-2xl leading-none"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {error && (
            <p
              className="mt-4 whitespace-pre-line border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-6 flex gap-3 border-t border-white/20 bg-brand-sidebar py-4">
      {children}
    </div>
  );
}
