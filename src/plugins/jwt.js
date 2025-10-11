const { jwtVerify } = require("jose");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

module.exports = async function (req, res, next) {
  const { token } = req.cookies;
  if (typeof token !== "string") {
    return res.status(400).json({ error: "Bad Request" });
  }

  try {
    const { payload } = await jwtVerify(token, process.env.JWT_SECRET, {
      algorithms: ["HS512"],
    });

    req.user = payload;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};
