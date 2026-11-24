// node render.mjs outdir "0-100,200" [workers]
import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const [,, outDir = "frames", spec = "0", W_ = "1"] = process.argv; const workers = +W_;
const root = path.resolve("."); const T = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split("?")[0])); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": T[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r); }).listen(0);
// AR=916|45|11|169 picks the output format · CAP=1 burns in captions · STYLE=<name> previews a look on every shot
const AR = process.env.AR || (process.env.HTML === "vsl45.html" ? "45" : "916");
const VP = { "916": { width: 1080, height: 1920 }, "45": { width: 1400, height: 1750 }, "11": { width: 1080, height: 1080 }, "169": { width: 1920, height: 1080 } }[AR];
const frames = []; for (const part of spec.split(",")) { const [a, b] = part.split("-").map(Number); for (let f = a; f <= (b ?? a); f++) frames.push(f); }
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch(); let done = 0; const t0 = Date.now();
async function worker(k) {
  const pg = await b.newPage({ viewport: VP });
  pg.on("pageerror", (e) => console.log("ERR", e.message));
  await pg.goto(`http://localhost:${srv.address().port}/vsl.html?ar=${AR}${process.env.CAP ? "&cap=1" : ""}${process.env.STYLE ? "&style=" + process.env.STYLE : ""}`); await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
  for (let i = k; i < frames.length; i += workers) {
    const f = frames[i], out = path.join(outDir, `f${String(f).padStart(5, "0")}.jpg`);
    if (process.env.RESUME && fs.existsSync(out)) continue;
    const d = await pg.evaluate(async (f) => { await window.renderFrame(f); return document.getElementById("c").toDataURL("image/jpeg", 0.93); }, f);
    fs.writeFileSync(out, Buffer.from(d.split(",")[1], "base64")); done++;
    if (done % 200 === 0) console.log(`${done}/${frames.length} ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
  }
}
await Promise.all([...Array(workers)].map((_, k) => worker(k)));
console.log(`DONE ${done} ${((Date.now() - t0) / Math.max(1, done)).toFixed(0)} ms/frame`); await b.close(); srv.close();
