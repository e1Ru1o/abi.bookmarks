const { execSync } = require("child_process");

try {
  console.log("Running yarn install to regenerate lockfile...");
  execSync("yarn install", {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  console.log("Lockfile regenerated successfully.");
} catch (error) {
  console.error("Failed to regenerate lockfile:", error.message);
  process.exit(1);
}
