// node events.mjs → work/events.json (every cut, pop, stamp, counter… the director scheduled) for audio/autoscore.py
import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const root = path.resolve("."); const T = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split("?")[0])); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": T[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r); }).listen(0);
const b = await chromium.launch(); const pg = await b.newPage(); pg.on("pageerror", e => console.log("ERR", e.message)); pg.on("console", m => { if (m.type() === "warning") console.log("WARN", m.text()); });
await pg.goto(`http://localhost:${srv.address().port}/vsl.html`); await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
const ev = await pg.evaluate(() => window.storyEvents()); fs.writeFileSync("work/events.json", JSON.stringify(ev, null, 0));
console.log(`work/events.json: ${ev.events.length} events, ${ev.beats.length} beats, ${ev.dur.toFixed(1)}s`); await b.close(); srv.close();
