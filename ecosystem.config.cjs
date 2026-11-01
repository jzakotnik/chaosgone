// pm2 process file. Secrets (ANTHROPIC_API_KEY) and optional settings (CLAUDE_MODEL, DATA_DIR) belong in
// .env.local next to this file; `next start` loads it automatically.
module.exports = {
  apps: [
    {
      name: "chaosgone",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3500",
      // One process only: SQLite is a single-file database and the batch import keeps state per request.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      // Large HEIC photos can spike memory; restart if the process ever balloons (adjust to your Pi).
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
