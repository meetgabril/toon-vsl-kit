import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const root = path.resolve("."); const T = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split("?")[0])); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": T[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r); }).listen(0);
const b = await chromium.launch(); fs.mkdirSync("ref", { recursive: true });
for (const p of (process.argv[2] || "tony,dex,extras").split(",")) { // 'cast:M' = generic sheet for character M
  const pg = await b.newPage({ viewport: { width: 2560, height: 1440 } }); pg.on("pageerror", e => console.log("ERR", e.message));
  await pg.goto(`http://localhost:${srv.address().port}/charsheet.html?${p.startsWith('cast:') ? 'p=cast&sp=' + p.slice(5) : 'p=' + p}`); await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const d = await pg.evaluate(() => document.getElementById("c").toDataURL("image/png")); fs.writeFileSync(`ref/sheet_${p.replace(':', '_')}.png`, Buffer.from(d.split(",")[1], "base64")); await pg.close();
}
await b.close(); srv.close();
