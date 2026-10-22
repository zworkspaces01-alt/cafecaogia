// Quote request statuses (inquiries.status), with their Studio labels and badge colours.
export const inquiryStatuses: Record<string, { label: string; tone: string }> = {
  new: { label: "Mới", tone: "bg-red-100 text-red-700" },
  contacted: { label: "Đã liên hệ", tone: "bg-sky-100 text-sky-900" },
  quoted: { label: "Đã báo giá", tone: "bg-amber-100 text-amber-900" },
  won: { label: "Chốt đơn", tone: "bg-lime/50 text-forest" },
  lost: { label: "Không thành", tone: "bg-mist text-muted" },
};
