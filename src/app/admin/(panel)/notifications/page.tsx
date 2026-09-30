import { NotificationsForm } from "@/components/admin/notifications-form";
import { PageTitle, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { mergeSettings } from "@/lib/settings";
import { isTelegramConfigured, telegramApi } from "@/lib/telegram";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Thông báo" };

export default async function NotificationsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const { notifications } = mergeSettings((data?.data ?? {}) as Partial<SiteSettings>);

  const me = isTelegramConfigured() ? await telegramApi<{ username: string }>("getMe") : null;
  const bot = me?.ok ? me.result.username : null;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Thông báo Telegram"
        description="Gửi yêu cầu báo giá, tiến độ đơn hàng, thay đổi nội dung và cảnh báo hệ thống vào từng topic của một nhóm Telegram."
      />

      {me && !me.ok && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">Không kết nối được bot: {me.error} — kiểm tra lại TELEGRAM_BOT_TOKEN.</p>
      )}

      {!bot && (
        <Panel title="Thiết lập lần đầu">
          <ol className="list-decimal space-y-2 ps-5 text-sm text-forest">
            <li>
              Mở <b>@BotFather</b> trên Telegram → <code>/newbot</code> → đặt tên, nhận <b>token</b>.
            </li>
            <li>
              Đặt token làm biến môi trường <code>TELEGRAM_BOT_TOKEN</code> (không nhập vào CMS — cài đặt CMS có thể đọc công khai):
              <ul className="mt-1 list-disc space-y-1 ps-5 text-muted">
                <li>
                  Cloudflare: <code>npx wrangler secret put TELEGRAM_BOT_TOKEN</code>
                </li>
                <li>
                  Vercel: Settings → Environment Variables; chạy ở máy: thêm vào <code>.env.local</code>
                </li>
              </ul>
            </li>
            <li>Deploy lại, rồi mở lại trang này.</li>
          </ol>
        </Panel>
      )}

      <Panel title="Chuẩn bị nhóm">
        <ol className="list-decimal space-y-1.5 ps-5 text-sm text-forest">
          <li>Tạo nhóm Telegram → Chỉnh sửa → bật <b>Topics</b>, rồi tạo các topic (ví dụ: Báo giá, Cà phê, Hạt điều, Đơn hàng, Nội dung, Hệ thống).</li>
          <li>Thêm bot{bot && <b> @{bot}</b>} vào nhóm, cho quyền gửi tin nhắn (đặt làm quản trị viên là đơn giản nhất).</li>
          <li>Trong mỗi topic, gửi một tin nhắn nhắc tới bot{bot ? <b> @{bot}</b> : ""} để bot nhận ra topic đó.</li>
          <li>Bấm <b>Dò nhóm &amp; topic</b> bên dưới, chọn nhóm và gán topic cho từng loại thông báo, bấm <b>Gửi thử</b>, rồi <b>Lưu</b>.</li>
        </ol>
      </Panel>

      <NotificationsForm initial={notifications.telegram} bot={bot} />
    </div>
  );
}
