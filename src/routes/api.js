const z = require("zod");
const argon2 = require("argon2");
const express = require("express");
const { SignJWT } = require("jose");
const cookieParser = require("cookie-parser");
const jwt = require("../plugins/jwt");
const { User } = require("../plugins/mongoose");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const router = express.Router();

router.use(express.json());

const loginSchema = z.union([
  z.object({
    username: z.string().min(1).max(32),
    password: z.string().min(6).max(512),
  }),
  z.object({
    email: z.email(),
    password: z.string().min(6).max(512),
  }),
]);

router.post("/login", async (req, res) => {
  const { success, data, error } = z.safeParse(loginSchema, req.body);

  if (!success) {
    return res.status(400).json({ error });
  }

  const user = await User.findOne({
    $or: [{ username: `${data.username}` }, { email: data.email }],
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const isValid = await argon2.verify(user.hash, password);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = await new SignJWT({
    username: user.username,
    admin: user.admin,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setExpirationTime("1 day")
    .setIssuer("CareGuideBD")
    .sign(process.env.JWT_SECRET);

  const domain = process.env.DOMAIN ?? "localhost";
  return res
    .cookie("token", token, {
      domain,
      httpOnly: true,
      secure: true,
      maxAge: 24 * 3600,
    })
    .redirect(`http://${domain}`);
});

const registerSchema = z.object({
  username: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  password: z.string().min(6).max(512),
  email: z.email(),
});

router.post("/register", async (req, res) => {
  const { success, data, error } = z.safeParse(registerSchema, req.body);

  if (!success) {
    return res.status(400).json({ error });
  }

  const { username, name, password, email } = data;
  const hash = await argon2.hash(password, { type: argon2.argon2id });

  const result = await User.findOne({ $or: [{ username }, { email }] });
  if (result) {
    return res.status(409).json({ error: "User already exists!" });
  }

  const user = await User.create({ username, name, email, hash });
  return res.json(user.toObject());
});

router.use(cookieParser());
router.use(jwt);

module.exports = router;
