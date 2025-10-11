require("dotenv").config();
const axios = require("axios");

const { BASE_URL, USERNAME, PASSWORD } = process.env;
if (!BASE_URL) throw new Error("BASE_URL is not defined");
if (!USERNAME) throw new Error("USERNAME is not defined");
if (!PASSWORD) throw new Error("PASSWORD is not defined");

const api = axios.create({
  baseURL: BASE_URL,
});

const {
  data: { token },
} = await api.post("/login", {
  username: USERNAME,
  password: PASSWORD,
});

const { data } = await api.get("/restart", {
  headers: { Cookie: `token=${token}` },
});

console.log("The server responded with:");
console.dir(data, { depth: null });
