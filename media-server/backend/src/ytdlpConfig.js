import fs from "fs";

const COOKIE_CANDIDATES = [
  process.env.YT_DLP_COOKIES_FILE,
  "/etc/secrets/cookies.txt",
  "/app/cookies.txt",
].filter(Boolean);

let resolvedCookiesPath = null;

export function initYtDlpCookies() {
  if (process.env.YT_DLP_COOKIES) {
    const target = "/app/cookies.txt";
    fs.writeFileSync(target, Buffer.from(process.env.YT_DLP_COOKIES, "base64"));
    resolvedCookiesPath = target;
    console.log("[ytdlp] Cookies loaded from YT_DLP_COOKIES env");
    return target;
  }

  for (const candidate of COOKIE_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      resolvedCookiesPath = candidate;
      console.log(`[ytdlp] Using cookies file: ${candidate}`);
      return candidate;
    }
  }

  console.warn(
    "[ytdlp] No YouTube cookies configured — cloud IPs are often blocked (429/bot check)"
  );
  return null;
}

export function getCookiesPath() {
  return resolvedCookiesPath;
}

export function hasYtDlpCookies() {
  return Boolean(resolvedCookiesPath);
}

export function getYtDlpExtraArgs() {
  const args = ["--js-runtimes", "deno"];
  if (resolvedCookiesPath) {
    args.push("--cookies", resolvedCookiesPath);
  }
  return args;
}
