import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const PORT = 8080;

/**
 * @type {{ [ext: string]: string | undefined }}
 */
const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "application/javascript; charset=UTF-8",
  css: "text/css",
  png: "image/png",
  svg: "image/svg+xml",
};

const STATIC_PATH = path.join(process.cwd(), "./");

const toBool = [() => true, () => false];

/**
 * @param {string} url
 */
const prepareFile = async (url) => {
  const paths = [STATIC_PATH, url];
  if (url.endsWith("/")) {
    paths.push("index.html");
  }

  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  if (!found) {
    return { found };
  }

  const ext = path.extname(filePath).substring(1).toLowerCase();
  const stream = fs.createReadStream(filePath);
  return { found, ext, stream };
};

http.createServer(async (req, res) => {
  const file = await prepareFile(req.url || "");
  const statusCode = file.found ? 200 : 404;
  if (!file.found) {
    res.writeHead(statusCode);
    return;
  }

  const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
  res.writeHead(statusCode, { "Content-Type": mimeType });
  file.stream.pipe(res);
  console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
