require("dotenv").config();
const express = require("express");
const cors = require("cors");
const api = require("./routes/api");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(api);

const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? 4041;
app.listen({ host, port }, () =>
  console.log(`Server running at http://${host}:${port}`),
);
