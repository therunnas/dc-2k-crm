app.get("/", (_req, res) => {
  res.json({
    app: "2K Command OS API",
    status: "online",
    routes: ["/health", "/api/tasks", "/api/obsidian/note"]
  });
});