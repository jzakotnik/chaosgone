// pm2 process file. Secrets (ANTHROPIC_API_KEY) and optional settings (CLAUDE_MODEL, DATA_DIR) belong in
// .env.local next to this file; `next start` loads it automatically.
module.exports = {
  apps: [
    {
      name: "chaosgone",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      // -H 0.0.0.0: listen on IPv4 only. Without -H, Node binds to "::" (IPv4 + IPv6), and if the host also has a
      // public IPv6 address, Chrome may load the page over it and then block the page's own requests
      // ("request client is not a secure context ... more-private address space"). See README, Troubleshooting.
      args: "start -p 3500 -H 0.0.0.0",
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
