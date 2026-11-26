// node render.mjs outdir "0-100,200" [workers]
import { chromium } from "playwright"; import { spawn } from "child_process"; import http from "http"; import fs from "fs"; import path from "path";
const [,, outDir = "frames", spec = "0", W_ = "1"] = process.argv; const workers = +W_;
const root = path.resolve("."); const T = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split("?")[0])); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": T[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r); }).listen(0);
// AR=916|45|11|169 output size · CAP=1 burns in subtitles · STYLE=<name> look on every shot · PNG=1 lossless · ALPHA=1 transparent PNG · SAFE=<zone> (reel, story, feed, wide, thumbnail, ad-vertical… see formats.json; default per size) · COVER="TEXT" cover plate
const AR = process.env.AR || (process.env.HTML === "vsl45.html" ? "45" : "916");
const VP = { "916": { width: 1080, height: 1920 }, "916p": { width: 540, height: 960 }, "45p": { width: 700, height: 875 }, "169p": { width: 960, height: 540 }, "11p": { width: 540, height: 540 }, "45": { width: 1400, height: 1750 }, "11": { width: 1080, height: 1080 }, "169": { width: 1920, height: 1080 } }[AR];
const frames = []; for (const part of spec.split(",")) { const [a, b] = part.split("-").map(Number); for (let f = a; f <= (b ?? a); f++) frames.push(f); }
fs.mkdirSync(outDir, { recursive: true });
const SX = process.env.STREAM ? spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", process.env.FPS || "24", "-c:v", "mjpeg", "-i", "-", "-vf", "format=yuv420p", "-c:v", "libx264", ...(process.env.X264 || "-preset veryfast -crf 19").split(" "), process.env.STREAM], { stdio: ["pipe", "inherit", "inherit"] }) : null;
const pend = new Map(); let nextI = 0; const feed = () => { while (SX && pend.has(nextI)) { SX.stdin.write(pend.get(nextI)); pend.delete(nextI); nextI++; } };
const b = await chromium.launch(); let done = 0; const t0 = Date.now();
async function worker(k) {
  const pg = await b.newPage({ viewport: VP });
  pg.on("pageerror", (e) => console.log("ERR", e.message));
  const E = process.env, opt = (E.CAP ? "&cap=1" : "") + (E.STYLE ? "&style=" + E.STYLE : "") + (E.ALPHA ? "&alpha=1" : "") + (E.SAFE ? "&safe=" + E.SAFE : "") + (E.COVER ? "&cover=" + encodeURIComponent(E.COVER) : "") + (E.COVERBG ? "&coverbg=" + E.COVERBG : "") + (E.QA ? "&qa=1" : "");
  await pg.goto(`http://localhost:${srv.address().port}/vsl.html?ar=${AR}${opt}`); await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
  for (let i = k; i < frames.length; i += workers) {
    const ext = (process.env.PNG || process.env.ALPHA) ? "png" : "jpg", f = frames[i], out = path.join(outDir, `f${String(f).padStart(5, "0")}.${ext}`);
    if (process.env.RESUME && fs.existsSync(out)) continue;
    const d = await pg.evaluate(async (fe) => { const [f, ext] = fe.split("|"); await window.renderFrame(+f); return document.getElementById("c").toDataURL(ext === "png" ? "image/png" : "image/jpeg", 0.93); }, [f, ext].join("|"));
    const buf = Buffer.from(d.split(",")[1], "base64"); fs.writeFileSync(out, buf); done++; if (SX) { pend.set(i, buf); feed(); }
    if (process.env.QA) fs.writeFileSync(out + ".qa.json", JSON.stringify(await pg.evaluate(() => window.qaDump())));
    if (done % 200 === 0) console.log(`${done}/${frames.length} ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
  }
}
await Promise.all([...Array(workers)].map((_, k) => worker(k)));
console.log(`DONE ${done} ${((Date.now() - t0) / Math.max(1, done)).toFixed(0)} ms/frame`); await b.close(); srv.close(); if (SX) { SX.stdin.end(); await new Promise(r => SX.on("close", r)); }
