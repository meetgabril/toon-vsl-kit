// node print_pdf.mjs <in.html> <out.pdf> — print a branded document to PDF (Letter) with the same Chromium the engine uses.
import { chromium } from "playwright"; import path from "path";
const [,, src, out] = process.argv;
const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto("file://" + path.resolve(src)); await pg.evaluate(() => document.fonts.ready);
await pg.pdf({ path: out, format: "Letter", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await b.close(); console.log("pdf:", out);
