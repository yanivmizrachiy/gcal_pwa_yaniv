'use client';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-[#101a30] border border-[#1e2a48] rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-[#9fb4d9] mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#101a30] border border-[#1e2a48] rounded-lg hover:bg-[#162138] transition"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg hover:bg-red-900/50 transition"
          >
            אשר מחיקה
          </button>
        </div>
      </div>
    </div>
  );
}
