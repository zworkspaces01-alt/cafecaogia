// Gets the Gmail refresh token for the inquiry auto-reply: `npm run gmail:auth`
// Needs an OAuth client of type "Desktop app" (README → "Email tự động cho khách"). Sign in as the
// sending account; the token only allows sending mail (gmail.send), not reading the inbox.
import { exec } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createInterface } from "node:readline/promises";
import { sendGmail } from "../src/lib/gmail";

const SENDER = process.env.GMAIL_SENDER?.trim() || "Cao Gia <davidcao.cg@gmail.com>";
const expected = /<([^>]+)>/.exec(SENDER)?.[1] ?? SENDER;
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q: string) => (await rl.question(q)).trim();

async function main() {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim() || (await ask("GMAIL_CLIENT_ID: "));
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim() || (await ask("GMAIL_CLIENT_SECRET: "));
  if (!clientId || !clientSecret) throw new Error("Thiếu Client ID hoặc Client secret.");

  const state = randomBytes(16).toString("hex");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  // Desktop clients accept any loopback port, so let the OS pick a free one.
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const redirectUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const code = new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const url = new URL(req.url ?? "/", redirectUri);
      if (url.pathname !== "/") return res.writeHead(404).end();
      const error = url.searchParams.get("error");
      const value = url.searchParams.get("code");
      const ok = !error && value && url.searchParams.get("state") === state;
      res.writeHead(ok ? 200 : 400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(ok ? "<h2>Xong — quay lại cửa sổ terminal.</h2>" : `<h2>Lỗi: ${error ?? "state không khớp"}</h2>`);
      if (ok) resolve(value);
      else reject(new Error(`Google trả về lỗi: ${error ?? "state không khớp"}`));
    });
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email https://www.googleapis.com/auth/gmail.send",
    access_type: "offline",
    prompt: "consent",
    login_hint: expected,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  console.log(`\nĐăng nhập bằng ${expected} trong trình duyệt. Nếu trình duyệt không tự mở, mở link này:\n\n${authUrl}\n`);
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? 'start ""' : "xdg-open";
  exec(`${opener} "${authUrl.toString()}"`);

  const authCode = await code;
  server.close();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const tokens = (await res.json()) as { refresh_token?: string; id_token?: string; error?: string; error_description?: string };
  if (!res.ok || !tokens.refresh_token) {
    throw new Error(`Không lấy được refresh token: ${tokens.error ?? res.status} ${tokens.error_description ?? ""}`);
  }

  const email = tokens.id_token
    ? (JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString()) as { email?: string }).email
    : undefined;
  console.log(`\nĐã cấp quyền cho: ${email ?? "(không rõ)"}`);
  if (email && email.replace(/\./g, "").toLowerCase() !== expected.replace(/\./g, "").toLowerCase()) {
    console.warn(`⚠️  Tài khoản này khác ${expected}. Gmail chỉ gửi được bằng chính tài khoản đã đăng nhập — chạy lại và chọn đúng tài khoản.`);
  }

  console.log(`
Lưu lên Cloudflare (mỗi lệnh sẽ hỏi giá trị — dán vào):
  npx wrangler secret put GMAIL_CLIENT_ID
  npx wrangler secret put GMAIL_CLIENT_SECRET
  npx wrangler secret put GMAIL_REFRESH_TOKEN

GMAIL_CLIENT_ID=${clientId}
GMAIL_REFRESH_TOKEN=${tokens.refresh_token}
(GMAIL_CLIENT_SECRET là giá trị bạn vừa nhập.)
`);

  if (email && /^y/i.test(await ask(`Gửi một thư thử tới ${email}? (y/N) `))) {
    const sent = await sendGmail(
      {
        to: email,
        subject: "Thử email tự động — Cao Gia",
        text: "Gmail API đã hoạt động. Khách để lại yêu cầu báo giá trên website sẽ nhận email xác nhận từ địa chỉ này.",
        html: "<p>Gmail API đã hoạt động. Khách để lại yêu cầu báo giá trên website sẽ nhận email xác nhận từ địa chỉ này.</p>",
      },
      { clientId, clientSecret, refreshToken: tokens.refresh_token, sender: SENDER },
    );
    console.log(sent ? "✓ Đã gửi — kiểm tra hộp thư." : "✗ Gửi không được — xem lỗi phía trên.");
  }
}

main()
  .catch((error: Error) => {
    console.error(`\n✗ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
