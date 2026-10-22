/** Date and time as the Studio shows them ("22/10/26, 16:29"). */
export const formatTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "chưa có";
