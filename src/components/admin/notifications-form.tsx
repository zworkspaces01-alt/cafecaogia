"use client";

import { useState, useTransition } from "react";
import { Loader2, Search, Send } from "lucide-react";
import { findTelegramChats, saveNotificationSettings, sendTestNotification } from "@/app/admin/actions";
import { Toggle } from "@/components/admin/fields";
import { Badge, inputClass, Panel, SaveBar } from "@/components/admin/ui";
import type { DiscoveredChat } from "@/lib/telegram";
import { isChatId, parseTopicInput, telegramTopics } from "@/lib/telegram-topics";
import type { NotificationSettings, NotifyTopic } from "@/lib/types";
import { cn } from "@/lib/utils";

type Telegram = NotificationSettings["telegram"];
type Status = { tone: "ok" | "error"; text: string } | null;

export function NotificationsForm({ initial, bot }: { initial: Telegram; bot: string | null }) {
  const [tg, setTg] = useState(initial);
  const [status, setStatus] = useState<Status>(null);
  const [saving, startSave] = useTransition();
  const [finding, startFind] = useTransition();
  const [found, setFound] = useState<{ chats: DiscoveredChat[]; error?: string } | null>(null);
  const [testing, setTesting] = useState<NotifyTopic | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<NotifyTopic, Status>>>({});

  const update = (next: Partial<Telegram>) => {
    setStatus(null);
    setTg((prev) => ({ ...prev, ...next }));
  };
  const setTopic = (key: NotifyTopic, next: Partial<Telegram["topics"][NotifyTopic]>) =>
    update({ topics: { ...tg.topics, [key]: { ...tg.topics[key], ...next } } });

  /** Accepts a topic ID or a pasted topic link (which also fills in the group's chat ID). */
  const setTopicInput = (key: NotifyTopic, value: string) => {
    const parsed = parseTopicInput(value);
    if (!parsed) return setTopic(key, { threadId: value });
    setTg((prev) => ({
      ...prev,
      chatId: parsed.chatId && !isChatId(prev.chatId) ? parsed.chatId : prev.chatId,
      topics: { ...prev.topics, [key]: { ...prev.topics[key], threadId: parsed.threadId } },
    }));
    setStatus(null);
  };

  const find = () =>
    startFind(async () => {
      const result = await findTelegramChats();
      setFound(result.ok ? { chats: result.chats } : { chats: [], error: result.error });
    });

  const test = async (key: NotifyTopic) => {
    setTesting(key);
    const result = await sendTestNotification(tg, key);
    setTestResults((prev) => ({
      ...prev,
      [key]: result.ok ? { tone: "ok", text: "Đã gửi — kiểm tra trong nhóm." } : { tone: "error", text: result.error },
    }));
    setTesting(null);
  };

  const save = () =>
    startSave(async () => {
      const result = await saveNotificationSettings(tg);
      setStatus(result.ok ? { tone: "ok", text: "Đã lưu." } : { tone: "error", text: result.error });
    });

  const topicsOfChat = found?.chats.find((c) => c.id === tg.chatId.trim())?.topics ?? [];

  return (
    <div className="space-y-5">
      <Panel title="Kết nối">
        <div className="space-y-4">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            Bot:{" "}
            {bot ? (
              <Badge tone="ok">@{bot}</Badge>
            ) : (
              <Badge tone="sample">Chưa cấu hình TELEGRAM_BOT_TOKEN</Badge>
            )}
          </p>
          <Toggle
            checked={tg.enabled}
            onChange={(enabled) => update({ enabled })}
            label="Gửi thông báo về Telegram"
            help="Tắt để tạm dừng toàn bộ thông báo mà không mất cấu hình."
          />
          <div className="grid gap-2 sm:grid-cols-[minmax(0,20rem)_auto] sm:items-end">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-forest">Chat ID của nhóm</span>
              <input
                className={inputClass}
                value={tg.chatId}
                placeholder="-1001234567890"
                spellCheck={false}
                onChange={(e) => update({ chatId: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={find}
              disabled={finding || !bot}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-mist px-5 text-sm text-forest hover:bg-sand disabled:opacity-50"
            >
              {finding ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Dò nhóm &amp; topic
            </button>
          </div>

          {found && (
            <div className="rounded-2xl bg-sand p-4 text-sm">
              {found.error ? (
                <p className="text-red-700">{found.error}</p>
              ) : found.chats.length === 0 ? (
                <p className="text-muted">
                  Bot chưa thấy nhóm nào trong 24 giờ qua. Thêm bot vào nhóm, gửi <b>@{bot}</b> trong từng topic rồi bấm dò lại.
                </p>
              ) : (
                <ul className="space-y-3">
                  {found.chats.map((chat) => (
                    <li key={chat.id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-forest">{chat.title}</span>
                        <span className="text-xs text-muted">{chat.id}</span>
                        {!chat.isForum && <Badge tone="sample">Chưa bật Topics</Badge>}
                        <button
                          type="button"
                          onClick={() => update({ chatId: chat.id })}
                          className={cn(
                            "rounded-full px-3 py-0.5 text-xs",
                            tg.chatId === chat.id ? "bg-forest text-white" : "bg-white text-forest hover:bg-mist",
                          )}
                        >
                          {tg.chatId === chat.id ? "Đang dùng" : "Dùng nhóm này"}
                        </button>
                      </div>
                      {chat.topics.length > 0 && (
                        <p className="mt-1 text-xs text-muted">
                          Topic: {chat.topics.map((t) => `${t.name} (#${t.id})`).join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="Topic nhận từng loại thông báo"
        description="Nhập ID topic, hoặc dán link topic (bấm giữ topic → Sao chép liên kết). Để trống = topic General."
      >
        <div className="divide-y divide-mist">
          {telegramTopics.map(({ key, label, help, optional }) => {
            const topic = tg.topics[key];
            const result = testResults[key];
            return (
              <div key={key} className={cn("grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_auto] lg:items-start", optional && "lg:ps-6")}>
                <Toggle checked={topic.enabled} onChange={(enabled) => setTopic(key, { enabled })} label={label} help={help} />
                <div className="grid gap-1.5">
                  <input
                    className={inputClass}
                    value={topic.threadId}
                    placeholder="ID topic hoặc https://t.me/c/…/…"
                    spellCheck={false}
                    disabled={!topic.enabled}
                    onChange={(e) => setTopicInput(key, e.target.value)}
                  />
                  {topicsOfChat.length > 0 && topic.enabled && (
                    <select
                      className={cn(inputClass, "py-2 text-xs")}
                      value=""
                      onChange={(e) => e.target.value !== "" && setTopic(key, { threadId: e.target.value === "general" ? "" : e.target.value })}
                    >
                      <option value="">Chọn topic đã dò được…</option>
                      <option value="general">General</option>
                      {topicsOfChat.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (#{t.id})
                        </option>
                      ))}
                    </select>
                  )}
                  {result && (
                    <span className={cn("text-xs", result.tone === "ok" ? "text-leaf" : "text-red-600")}>{result.text}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => test(key)}
                  disabled={!bot || !topic.enabled || testing !== null}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-mist px-4 text-sm text-forest hover:bg-sand disabled:opacity-50"
                >
                  {testing === key ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Gửi thử
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      <SaveBar label="Lưu cài đặt thông báo" saving={saving} onSave={save} status={status} />
    </div>
  );
}
