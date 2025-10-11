const z = require("zod");
const argon2 = require("argon2");
const express = require("express");
const { SignJWT } = require("jose");
const cookieParser = require("cookie-parser");
const { execSync } = require("child_process");
const jwt = require("../plugins/jwt");
const { User, Post } = require("../mongoose");

const { JWT_SECRET, DOMAIN } = process.env;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const router = express.Router();

router.use(express.json());
router.use(cookieParser());
router.use(jwt);

const loginSchema = z.object({
  email: z.email().optional(),
  username: z.string().min(1).max(32).optional(),
  password: z.string().min(6).max(512),
});

router.post("/login", async ({ body }, res) => {
  const { success, data, error } = z.safeParse(loginSchema, body);
  if (!success) return res.status(400).json({ error });

  const { username, password } = data;
  if (!username && !email) {
    return res.status(400).json({ error: "Username or email is required" });
  }

  const user = await User.findOne({
    ...(username ?? { username }),
    ...(email ?? { email }),
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const isValid = await argon2.verify(user.hash, password);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const signer = new SignJWT({
    username: user.username,
    admin: user.admin,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setExpirationTime("1 day")
    .setIssuer("CareGuideBD");

  const token = await signer.sign(JWT_SECRET);

  const domain = DOMAIN ?? "localhost";
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

router.post("/register", async ({ body }, res) => {
  const { success, data, error } = z.safeParse(registerSchema, body);

  if (!success) {
    return res.status(400).json({ error });
  }

  const { username, name, password, email } = data;
  const hash = await argon2.hash(password, { type: argon2.argon2id });

  const existingUser = await User.findOne(
    { $or: [{ username }, { email }] },
    { _id: 1 },
  );

  if (existingUser) {
    return res.status(409).json({
      error: "The given username or email already exists in our database!",
    });
  }

  const user = await User.create({ username, name, email, hash });
  return res.json(user.toObject());
});

router.get("/posts", async (_, res) => {
  const posts = await Post.find({}, { _id: 0 }, { createdAt: -1 });
  return res.json(posts);
});

const postSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(4096),
});

router.post("/posts", async ({ body, user: { username } }, res) => {
  const { success, data, error } = z.safeParse(postSchema, body);
  if (!success) return res.status(400).json({ error });

  const post = await Post.create({ ...data, username });
  return res.json(post.toObject());
});

/**
 * Admin only route to get all users
 * Only route for admins, wanted to keep it simple
 */
router.get("/users", async ({ admin }, res) => {
  if (!admin) return res.status(403).json({ error: "Forbidden" });

  const users = await User.find({}, { _id: 0, hash: 0 }, { createdAt: -1 });
  return res.json(users);
});

/**
 * Ok, why not also let admins restart the server?
 * We can call this from CI/CD also
 */
router.get("/restart", async ({ admin }, res) => {
  if (!admin) return res.status(403).json({ error: "Forbidden" });

  const outputs = [execSync("git pull")];

  res.json({ outputs: outputs.map((o) => o.toString("utf8")) });
  process.exit(0);
});

module.exports = router;
