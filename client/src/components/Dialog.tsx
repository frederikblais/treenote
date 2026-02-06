import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Dialog({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className="rounded-lg shadow-xl p-0 backdrop:bg-black/40 max-w-sm w-full"
      onClose={onClose}
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
