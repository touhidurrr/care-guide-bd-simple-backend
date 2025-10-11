const { jwtVerify } = require("jose");

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

module.exports = async function ({ cookies: { token } }, res, next) {
  if (typeof token !== "string") {
    return res.status(400).json({ error: "Bad Request" });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS512"],
    });

    req.user = payload;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};
