import http from "node:http";
import http2 from "node:http2";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// An HTTP/2 front for a local Next server, so media loading can be measured the
// way Vercel serves it. `next dev` and `next start` only speak HTTP/1.1, where
// the browser opens at most six connections per host and a partly downloaded
// video that has been scrolled past holds one of them open. Over HTTP/2 every
// request shares one connection, so that starvation can't happen. Browsers only
// use HTTP/2 over TLS, hence the throwaway self-signed certificate (open the
// audits with ignoreHTTPSErrors, which travel-video.mjs does for https bases).
//
//   UPSTREAM=http://127.0.0.1:3100 PORT=3443 node .verify/h2-proxy.mjs

const UPSTREAM = new URL(process.env.UPSTREAM ?? "http://127.0.0.1:3100");
const PORT = Number(process.env.PORT ?? 3443);

const dir = os.tmpdir();
const key = path.join(dir, "portfolio-h2-key.pem");
const cert = path.join(dir, "portfolio-h2-cert.pem");
if (!existsSync(key) || !existsSync(cert)) {
  // Some Windows openssl builds point at a config file that doesn't exist and
  // refuse to run without one, so bring a minimal one.
  const conf = path.join(dir, "portfolio-h2-openssl.cnf");
  writeFileSync(conf, "[req]\ndistinguished_name = dn\nprompt = no\n[dn]\nCN = localhost\n");
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-config", conf,
    "-keyout", key, "-out", cert, "-days", "7",
  ]);
}

const HOP = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection", "http2-settings"]);

const server = http2.createSecureServer(
  { key: readFileSync(key), cert: readFileSync(cert), allowHTTP1: true },
  (req, res) => {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!k.startsWith(":") && !HOP.has(k)) headers[k] = v;
    }
    headers.host = UPSTREAM.host;
    const upstream = http.request(
      { host: UPSTREAM.hostname, port: UPSTREAM.port, method: req.method, path: req.url, headers },
      (up) => {
        const out = {};
        for (const [k, v] of Object.entries(up.headers)) if (!HOP.has(k)) out[k] = v;
        res.writeHead(up.statusCode ?? 502, out);
        up.pipe(res);
      },
    );
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    // A stream the browser cancels (a clip scrolled past) releases upstream too.
    res.on("close", () => upstream.destroy());
    req.pipe(upstream);
  },
);

server.listen(PORT, () => console.log(`h2 proxy https://localhost:${PORT} -> ${UPSTREAM.origin}`));
