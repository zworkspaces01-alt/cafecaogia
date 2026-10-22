/** Marks the page builder's preview, so a draft is never mistaken for the live page. */
export function PreviewBanner() {
  return (
    <p className="fixed start-4 bottom-4 z-[60] rounded-full bg-ink/90 px-4 py-2 text-xs text-white shadow-lg backdrop-blur print:hidden">
      Bản xem trước — chưa xuất bản
    </p>
  );
}
