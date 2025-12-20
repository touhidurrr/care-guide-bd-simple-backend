require("dotenv").config();
const express = require("express");
const cors = require("cors");
const api = require("./routes/api");
const { existsSync, unlinkSync, chmodSync } = require("fs");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(api);

const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? 4041;
const unix = process.env.UNIX_SOCKET_PATH;

if (unix && existsSync(unix)) {
  unlinkSync(unix);
}

const server = app.listen(unix ? unix : { host, port });

server.once("listening", () => {
  const serverAddress = server.address();

  if (typeof serverAddress === "string") {
    chmodSync(unix, 0o777);
    return console.log(`Server listening to unix socket ${serverAddress}`);
  }

  const { address, port, family } = serverAddress;
  const hostname = family === "IPv6" ? `[${address}]` : address;
  console.log(`Server listening to http://${hostname}:${port}`);
});
