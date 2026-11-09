// WakaTime 지난 7일 언어별 통계를 gist에 쓴다. 의존성 없음(Node 18+ 내장 fetch).
// WakaTime은 2026-11-01부터 API 키를 플러그인 전용으로 막았다 → 개인 OAuth 토큰(Bearer) 사용.
const { GIST_ID, GH_TOKEN, WAKATIME_OAUTH_TOKEN } = process.env;
const missing = ["GIST_ID", "GH_TOKEN", "WAKATIME_OAUTH_TOKEN"].filter(k => !process.env[k]);

async function request(url, token, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body && { "Content-Type": "application/json" }) }
  });
  if (!res.ok) throw new Error(`${init.method || "GET"} ${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

function trimRightStr(str, len) {
  return str.length > len ? str.substring(0, len - 3) + "..." : str;
}

function generateBarChart(percent, size) {
  const syms = "░▏▎▍▌▋▊▉█";
  const frac = Math.floor((size * 8 * percent) / 100);
  const barsFull = Math.floor(frac / 8);
  if (barsFull >= size) return syms[8].repeat(size);
  return (syms[8].repeat(barsFull) + syms[frac % 8]).padEnd(size, syms[0]);
}

function formatLines(languages) {
  return languages.slice(0, 5).map(({ name, percent, text }) =>
    [trimRightStr(name, 10).padEnd(10), text.padEnd(14), generateBarChart(percent, 21), percent.toFixed(1).padStart(5) + "%"].join(" ")
  );
}

async function main() {
  if (missing.length) throw new Error(`환경변수 누락: ${missing.join(", ")}`);
  const stats = await request("https://wakatime.com/api/v1/users/current/stats/last_7_days", WAKATIME_OAUTH_TOKEN);
  // 202 = WakaTime이 아직 집계 중 → languages가 비어 올 수 있다. 다음 실행에 맡긴다.
  const lines = formatLines(stats.data?.languages ?? []);
  if (lines.length === 0) return console.log("통계 없음(집계 중일 수 있음) — gist 유지");

  const gistUrl = `https://api.github.com/gists/${GIST_ID}`;
  const gist = await request(gistUrl, GH_TOKEN);
  const filename = Object.keys(gist.files)[0]; // 기존 파일을 같은 자리에서 갱신
  await request(gistUrl, GH_TOKEN, {
    method: "PATCH",
    body: JSON.stringify({ files: { [filename]: { filename: "📊 Weekly development breakdown", content: lines.join("\n") } } })
  });
  console.log(lines.join("\n"));
}

if (require.main === module) {
  main().catch(e => { console.error(e.message); process.exit(1); });
} else {
  module.exports = { formatLines, generateBarChart };
}
