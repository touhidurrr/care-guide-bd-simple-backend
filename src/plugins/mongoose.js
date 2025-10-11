const mongoose = require("mongoose");

const { MONGO_URL } = process.env;
if (!MONGO_URL) {
  throw new Error("MONGO_URL not set");
}

mongoose.connect(MONGO_URL, {
  dbName: "care_guide",
  appName: "Care Guide Backend",
  retryWrites: true,
  compressors: ["zstd"],
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hash: { type: String, required: true },
    admin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

exports.User = mongoose.model("User", userSchema);
exports.Post = mongoose.model("Post", postSchema);
