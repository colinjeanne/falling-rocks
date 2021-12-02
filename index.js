const statik = require("node-static");

const fileServer = new statik.Server("./");
require("http").createServer((request, response) => {
  request.addListener("end", () => fileServer.serve(request, response)).resume();
}).listen(8080);
