import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const root=path.resolve("."); const T={".html":"text/html",".js":"text/javascript",".woff2":"font/woff2",".json":"application/json"};
const srv=http.createServer((q,r)=>{const p=path.join(root,decodeURIComponent(q.url.split("?")[0])); if(!fs.existsSync(p)){r.writeHead(404);return r.end();} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"}); fs.createReadStream(p).pipe(r);}).listen(0);
const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:2160,height:1920}}); pg.on("pageerror",e=>console.log("ERR",e.message));
await pg.goto(`http://localhost:${srv.address().port}/ptest.html`); await pg.waitForFunction(()=>window.ready,null,{timeout:30000});
const d=await pg.evaluate(()=>document.getElementById("c").toDataURL("image/jpeg",.93)); fs.writeFileSync("stills/cast_v5.jpg",Buffer.from(d.split(",")[1],"base64")); await b.close(); srv.close();
