const { jwtVerify } = require("jose");

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const jwtKey = Buffer.from(JWT_SECRET, "utf8");
const ignoredPaths = ["/login", "/register"];

module.exports = async function (req, res, next) {
  if (ignoredPaths.includes(req.path)) {
    return next();
  }

  const { token } = req.cookies;
  if (typeof token !== "string") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { payload } = await jwtVerify(token, jwtKey, {
      algorithms: ["HS512"],
    });

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
