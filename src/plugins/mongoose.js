const mongoose = require("mongoose");

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL not set");
}

mongoose.connect(process.env.MONGO_URL, {
  dbName: "CareGuide",
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

exports.User = mongoose.model("User", userSchema);
