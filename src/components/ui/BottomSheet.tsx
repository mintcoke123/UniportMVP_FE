import { useEffect, useState, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * 모바일용 바텀시트. overlay 클릭 / ESC / X 버튼으로 닫기.
 * open 시 body scroll lock. 200~300ms slide transition.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setVisible(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden" aria-modal="true" role="dialog">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="닫기"
      />
      {/* Sheet: slide up */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex h-[90vh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">{title ?? ""}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            aria-label="닫기"
          >
            <i className="ri-close-line text-xl text-gray-700" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
