"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Award,
  Bell,
  Building2,
  ChartColumn,
  Check,
  ExternalLink,
  Handshake,
  History,
  ImageIcon,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  LogOut,
  MessageSquareQuote,
  Newspaper,
  Package,
  Redo2,
  Rocket,
  ScrollText,
  Search,
  Undo2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { signOut, newInquiryCount } from "@/app/admin/actions";
import { discardChanges, listChanges, publishChanges, type Change } from "@/app/admin/publish-actions";
import { changeOwnPassword } from "@/app/admin/users-actions";
import { inputClass } from "@/components/admin/ui";
import { LogoMark } from "@/components/logo";
import { formatTime } from "@/lib/admin/format";
import { MIN_PASSWORD, roleInfo, type Permission, type Role } from "@/lib/admin/roles";
import { cn } from "@/lib/utils";

// The Studio shell, modelled on VSAP Studio: a top bar (save status and undo/redo of the open editor,
// Publish for every pending change, the account menu) and an icon rail for the sections. Editors put
// their status and buttons into the top bar with <StudioToolbar>, register a flush so Publish never
// misses an edit still waiting for autosave, and listen for publishes and discards to resync.

export type StudioUser = { email: string; name: string; role: Role; permissions: Permission[] };

type Listener = (keys: string[]) => void;

type StudioContextValue = {
  user: StudioUser;
  can: (permission: Permission) => boolean;
  toolbar: HTMLElement | null;
  /** Re-reads the pending changes count (after an autosave). */
  refreshChanges: () => void;
  /** Saves now whatever the editor still holds; resolves false if that failed. */
  registerFlush: (flush: () => Promise<boolean>) => () => void;
  subscribe: (event: "published" | "discarded", listener: Listener) => () => void;
  flash: (message: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudio outside <Studio>");
  return value;
}

/** Puts its children in the Studio top bar (status, undo/redo of the open editor). */
export function StudioToolbar({ children }: { children: React.ReactNode }) {
  const { toolbar } = useStudio();
  return toolbar ? createPortal(children, toolbar) : null;
}

type NavItem = { href: string; match?: string; label: string; icon: typeof Inbox; perm: Permission; exact?: boolean };

const nav: (NavItem | "-")[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, perm: "content.read", exact: true },
  { href: "/admin/pages/home", match: "/admin/pages", label: "Trang", icon: LayoutTemplate, perm: "content.read" },
  { href: "/admin/products", label: "Sản phẩm", icon: Package, perm: "content.read" },
  { href: "/admin/posts", label: "Bài viết", icon: Newspaper, perm: "content.read" },
  { href: "/admin/testimonials", label: "Đánh giá", icon: MessageSquareQuote, perm: "content.read" },
  { href: "/admin/partners", label: "Đối tác", icon: Handshake, perm: "content.read" },
  { href: "/admin/certifications", label: "Chứng nhận", icon: Award, perm: "content.read" },
  { href: "/admin/team", label: "Đội ngũ", icon: Users, perm: "content.read" },
  { href: "/admin/media", label: "Thư viện ảnh", icon: ImageIcon, perm: "content.read" },
  { href: "/admin/history", label: "Lịch sử", icon: History, perm: "content.read" },
  "-",
  { href: "/admin/inquiries", label: "Báo giá", icon: Inbox, perm: "inquiries" },
  "-",
  { href: "/admin/settings", label: "Công ty", icon: Building2, perm: "settings" },
  { href: "/admin/seo", label: "SEO", icon: Search, perm: "settings" },
  { href: "/admin/analytics", label: "Phân tích", icon: ChartColumn, perm: "settings" },
  "-",
  { href: "/admin/users", label: "Tài khoản", icon: UserCog, perm: "users" },
  { href: "/admin/audit", label: "Nhật ký", icon: ScrollText, perm: "audit" },
  { href: "/admin/notifications", label: "Thông báo", icon: Bell, perm: "users" },
];

export function Studio({
  user,
  initialPending,
  initialInquiries,
  lastPublishedAt,
  children,
}: {
  user: StudioUser;
  initialPending: number;
  initialInquiries: number;
  lastPublishedAt: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState(initialPending);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [publishedAt, setPublishedAt] = useState(lastPublishedAt);
  const [toast, setToast] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const flushes = useRef(new Set<() => Promise<boolean>>());
  const listeners = useRef({ published: new Set<Listener>(), discarded: new Set<Listener>() });
  const can = useCallback((p: Permission) => user.permissions.includes(p), [user.permissions]);

  // A server refresh (after a publish, a status change…) brings new counts.
  const [counted, setCounted] = useState({ initialPending, initialInquiries });
  if (counted.initialPending !== initialPending || counted.initialInquiries !== initialInquiries) {
    setCounted({ initialPending, initialInquiries });
    setPending(initialPending);
    setInquiries(initialInquiries);
  }

  const refreshChanges = useCallback(() => {
    if (!user.permissions.includes("content.read")) return;
    listChanges().then((r) => r.ok && setPending(r.changes.length));
  }, [user.permissions]);

  // New quote requests, for the badge on "Báo giá".
  useEffect(() => {
    if (!user.permissions.includes("inquiries")) return;
    const poll = () => newInquiryCount().then(setInquiries, () => {});
    const timer = setInterval(poll, 120_000);
    return () => clearInterval(timer);
  }, [user.permissions]);

  const flash = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }, []);

  const context = useMemo<StudioContextValue>(
    () => ({
      user,
      can,
      toolbar,
      refreshChanges,
      registerFlush: (flush) => {
        flushes.current.add(flush);
        return () => flushes.current.delete(flush);
      },
      subscribe: (event, listener) => {
        listeners.current[event].add(listener);
        return () => listeners.current[event].delete(listener);
      },
      flash,
    }),
    [user, can, toolbar, refreshChanges, flash],
  );

  const flushAll = useCallback(async () => (await Promise.all([...flushes.current].map((f) => f()))).every(Boolean), []);
  const emit = (event: "published" | "discarded", keys: string[]) => listeners.current[event].forEach((l) => l(keys));

  const isActive = (item: NavItem) => {
    const base = item.match ?? item.href;
    return item.exact ? pathname === base : pathname === base || pathname.startsWith(`${base}/`);
  };
  const items = nav.filter((n, i, list) => {
    if (n !== "-") return can(n.perm);
    // A divider only between two visible groups.
    const before = list.slice(0, i).some((x) => x !== "-" && can(x.perm));
    const after = list.slice(i + 1).find((x) => x === "-" || can(x.perm));
    return before && after !== undefined && after !== "-";
  });
  const initial = (user.name.trim().split(/\s+/).pop()?.[0] ?? user.email[0] ?? "?").toUpperCase();

  return (
    <StudioContext.Provider value={context}>
      <div className="flex h-dvh flex-col bg-sand text-ink">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-mist bg-white px-3 lg:px-4">
          <Link href={can("content.read") ? "/admin" : "/admin/inquiries"} className="flex shrink-0 items-center gap-2">
            <LogoMark className="h-8 w-auto" />
            <span className="rounded-md bg-forest px-2 py-0.5 text-[11px] font-semibold tracking-wider text-lime uppercase">Studio</span>
          </Link>
          {/* The open editor's status, undo/redo and own buttons (StudioToolbar). */}
          <div ref={setToolbar} className="hidden min-w-0 flex-1 items-center gap-1.5 lg:flex" />
          <div className="ms-auto flex shrink-0 items-center gap-1.5">
            {can("content.read") && (
              <span className="hidden text-xs text-muted 2xl:inline">Xuất bản lần cuối: {formatTime(publishedAt)}</span>
            )}
            <a href="/en" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-sand hover:text-forest sm:inline-flex">
              <ExternalLink className="size-4" /> Xem website
            </a>
            {can("content.publish") ? (
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-forest transition hover:bg-lime-deep disabled:bg-sand disabled:text-muted"
                disabled={pending === 0}
              >
                <Rocket className="size-4" /> Xuất bản
                {pending > 0 && <span className="rounded-full bg-forest px-1.5 text-[11px] leading-5 text-white tabular-nums">{pending}</span>}
              </button>
            ) : (
              can("content.write") &&
              pending > 0 && (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-900">{pending} thay đổi chờ Biên tập chính xuất bản</span>
              )
            )}
            <div className="relative ms-1">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg py-1 ps-1 pe-2 hover:bg-sand"
              >
                <span className="grid size-8 place-items-center rounded-full bg-forest text-xs font-semibold text-lime">{initial}</span>
                <span className="hidden text-start leading-tight 2xl:block">
                  <span className="block text-xs font-medium text-forest">{user.name}</span>
                  <span className="block text-[11px] text-muted">{roleInfo[user.role].label}</span>
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute end-0 top-full z-[95] mt-2 w-64 rounded-xl border border-mist bg-white p-2 shadow-xl">
                    <div className="px-2 py-2">
                      <p className="text-sm font-medium text-forest">{user.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span className="truncate">{user.email}</span> <RoleBadge role={user.role} />
                      </p>
                    </div>
                    <div className="my-1 h-px bg-mist" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setPasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-forest hover:bg-sand"
                    >
                      <KeyRound className="size-4 text-muted" /> Đổi mật khẩu
                    </button>
                    <form
                      action={async () => {
                        await flushAll();
                        await signOut();
                      }}
                    >
                      <button type="submit" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-forest hover:bg-sand">
                        <LogOut className="size-4 text-muted" /> Đăng xuất
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Sections: a rail on wide screens, a scrolling strip on phones. */}
          <nav className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-mist bg-white px-2 py-1.5 lg:w-[4.75rem] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-e lg:border-b-0 lg:px-0 lg:py-3">
            {items.map((item, i) =>
              item === "-" ? (
                <span key={`sep-${i}`} className="mx-1 w-px shrink-0 bg-mist lg:mx-3 lg:my-1 lg:h-px lg:w-auto" />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs leading-tight transition lg:mx-2 lg:flex-col lg:gap-1 lg:px-1 lg:py-2 lg:text-center lg:text-[10px]",
                    isActive(item) ? "bg-forest text-white" : "text-muted hover:bg-sand hover:text-forest",
                  )}
                >
                  <item.icon className="size-4 lg:size-[18px]" />
                  {item.label}
                  {item.href === "/admin/inquiries" && inquiries > 0 && (
                    <span className="rounded-full bg-red-600 px-1 text-[10px] leading-4 font-semibold text-white lg:absolute lg:end-1 lg:top-1 lg:min-w-4" aria-label={`${inquiries} yêu cầu mới`}>
                      {inquiries > 99 ? "99+" : inquiries}
                    </span>
                  )}
                </Link>
              ),
            )}
          </nav>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
        </div>

        {publishOpen && (
          <PublishDialog
            flushAll={flushAll}
            onClose={() => setPublishOpen(false)}
            onDone={(event, keys, message, left) => {
              emit(event, keys);
              setPending(left);
              if (event === "published") setPublishedAt(new Date().toISOString());
              flash(message);
            }}
          />
        )}
        {passwordOpen && <ChangePassword onClose={() => setPasswordOpen(false)} onDone={() => flash("Đã đổi mật khẩu. Các trình duyệt khác đã được đăng xuất.")} />}
        {toast && (
          <div role="status" className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-forest px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </StudioContext.Provider>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const tones: Record<Role, string> = {
    admin: "bg-forest text-lime",
    publisher: "bg-lime/40 text-forest",
    editor: "bg-sky-100 text-sky-900",
    sales: "bg-amber-100 text-amber-900",
  };
  return <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", tones[role])}>{roleInfo[role].label}</span>;
}

const actionNames: Record<Change["action"], { label: string; tone: string }> = {
  create: { label: "Mới", tone: "bg-sky-100 text-sky-900" },
  update: { label: "Sửa", tone: "bg-amber-100 text-amber-900" },
  delete: { label: "Xoá", tone: "bg-red-100 text-red-700" },
};

/** Every pending change, all ticked: publish them (with a note) or throw the ticked ones away. */
function PublishDialog({
  flushAll,
  onClose,
  onDone,
}: {
  flushAll: () => Promise<boolean>;
  onClose: () => void;
  onDone: (event: "published" | "discarded", keys: string[], message: string, left: number) => void;
}) {
  const router = useRouter();
  const [changes, setChanges] = useState<Change[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    (async () => {
      const flushed = await flushAll();
      const result = await listChanges();
      if (!live) return;
      if (!flushed) setError("Có thay đổi chưa lưu được — kiểm tra lại trình sửa đang mở.");
      if (!result.ok) return setError(result.error);
      setChanges(result.changes);
      setChosen(new Set(result.changes.map((c) => c.key)));
    })();
    return () => {
      live = false;
    };
  }, [flushAll]);

  const keys = [...chosen];
  const left = (changes?.length ?? 0) - keys.length;

  const publish = () =>
    startTransition(async () => {
      const result = await publishChanges(keys.length === changes?.length ? null : keys, note);
      if (!result.ok) return setError(result.error);
      onDone("published", result.published, "Đã xuất bản. Website đã được cập nhật.", left);
      router.refresh();
      onClose();
    });
  const discard = () => {
    if (!confirm(`Bỏ ${keys.length} thay đổi đã chọn? Website giữ nguyên bản đang chạy.`)) return;
    startTransition(async () => {
      const result = await discardChanges(keys);
      if (!result.ok) return setError(result.error);
      onDone("discarded", keys, "Đã bỏ các thay đổi.", left);
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Xuất bản" className="flex max-h-[85svh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between p-6 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-forest">Xuất bản thay đổi?</h2>
            <p className="mt-1 text-sm text-muted">Các mục đã chọn thay thế nội dung đang chạy trên website. Mỗi lần xuất bản được lưu trong Lịch sử để hoàn tác.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-muted hover:bg-sand">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {!changes && !error && <Loader2 className="mx-auto my-8 size-6 animate-spin text-muted" />}
          {changes?.length === 0 && <p className="my-6 text-center text-sm text-muted">Không còn thay đổi nào chờ xuất bản.</p>}
          {changes && changes.length > 0 && (
            <ul className="divide-y divide-mist rounded-xl border border-mist">
              {changes.map((c) => (
                <li key={c.key} className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={chosen.has(c.key)}
                    onChange={(e) =>
                      setChosen((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(c.key);
                        else next.delete(c.key);
                        return next;
                      })
                    }
                    aria-label={`Chọn ${c.title}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("rounded-full px-1.5 text-[10px] leading-4 font-medium", actionNames[c.action].tone)}>{actionNames[c.action].label}</span>
                      <Link href={c.href} onClick={onClose} className="truncate text-sm text-forest hover:text-leaf">
                        {c.title}
                      </Link>
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {c.group} · {c.updatedBy || "—"} · {formatTime(c.updatedAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {changes && changes.length > 0 && (
            <label className="mt-4 block">
              <span className="text-xs font-medium text-forest">Ghi chú (không bắt buộc)</span>
              <input
                autoFocus
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && keys.length > 0 && publish()}
                placeholder="VD: Ảnh mới cho Robusta S18, thêm FAQ"
                className={cn(inputClass, "mt-1")}
              />
            </label>
          )}
          {error && (
            <p className="mt-4 flex gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 p-6 pt-5">
          {changes && changes.length > 0 && (
            <button type="button" onClick={discard} disabled={busy || keys.length === 0} className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">
              Bỏ thay đổi đã chọn
            </button>
          )}
          <button type="button" onClick={onClose} className="ms-auto rounded-lg px-4 py-2 text-sm text-muted hover:bg-sand">
            Huỷ
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={busy || keys.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-forest hover:bg-lime-deep disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} Xuất bản {keys.length > 0 && `(${keys.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePassword({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (next !== repeat) return setError("Hai mật khẩu mới không khớp.");
          startTransition(async () => {
            const result = await changeOwnPassword(current, next);
            if (!result.ok) return setError(result.error);
            onDone();
            onClose();
          });
        }}
      >
        <h2 className="text-lg font-semibold text-forest">Đổi mật khẩu</h2>
        <div className="mt-4 grid gap-3">
          {(
            [
              ["Mật khẩu hiện tại", current, setCurrent, "current-password"],
              [`Mật khẩu mới (ít nhất ${MIN_PASSWORD} ký tự)`, next, setNext, "new-password"],
              ["Nhập lại mật khẩu mới", repeat, setRepeat, "new-password"],
            ] as const
          ).map(([label, value, set, autoComplete]) => (
            <label key={label} className="grid gap-1 text-xs font-medium text-forest">
              {label}
              <input type="password" required autoComplete={autoComplete} value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-sand">
            Huỷ
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />} Lưu
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Pieces for the editors' toolbar ─────────────────────────────────────────

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

/** Autosave status, worded like VSAP Studio. */
export function SaveBadge({ state, error, dirty }: { state: SaveState; error?: string | null; dirty: boolean }) {
  const { can } = useStudio();
  if (state === "error")
    return (
      <span title={error ?? undefined} className="inline-flex max-w-80 items-center gap-1.5 truncate rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700">
        <AlertTriangle className="size-3.5 shrink-0" /> Lưu thất bại{error ? ` — ${error}` : ""}
      </span>
    );
  if (state === "pending" || state === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1 text-xs text-muted">
        <Loader2 className="size-3.5 animate-spin" /> Đang lưu nháp…
      </span>
    );
  if (dirty)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
        <Check className="size-3.5" /> Đã lưu nháp · {can("content.publish") ? "chưa xuất bản" : "chờ Biên tập chính xuất bản"}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/30 px-2.5 py-1 text-xs text-forest">
      <Check className="size-3.5" /> Đang khớp với website
    </span>
  );
}

export function UndoRedo({ canUndo, canRedo, onUndo, onRedo }: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  return (
    <span className="flex items-center">
      <button type="button" title="Hoàn tác (⌘Z)" aria-label="Hoàn tác" onClick={onUndo} disabled={!canUndo} className="rounded-lg p-2 text-muted hover:bg-sand hover:text-forest disabled:opacity-30">
        <Undo2 className="size-4" />
      </button>
      <button type="button" title="Làm lại (⇧⌘Z)" aria-label="Làm lại" onClick={onRedo} disabled={!canRedo} className="rounded-lg p-2 text-muted hover:bg-sand hover:text-forest disabled:opacity-30">
        <Redo2 className="size-4" />
      </button>
    </span>
  );
}

/** For views that need the three-column layout. */
export function WideScreenNotice({ what }: { what: string }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center lg:hidden">
      <p className="max-w-sm text-sm text-muted">{what} cần màn hình rộng hơn (từ 1024px). Hãy mở trên máy tính hoặc máy tính bảng xoay ngang.</p>
    </div>
  );
}
