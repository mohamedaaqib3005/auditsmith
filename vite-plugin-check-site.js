// vite-plugin-check-site.js
// Dev-server endpoint for the in-app "Check live site" button.
// Browsers cannot fetch other websites directly (CORS), so the button calls
// GET /api/check-site?site=vlncy.com on the DEV SERVER, which runs the same
// checkSite logic in Node (no CORS there) and returns the results as JSON.
// Dev-only by nature: it lives in Vite's dev middleware.

export default function checkSitePlugin() {
  return {
    name: "auditsmith-check-site",
    configureServer(server) {
      server.middlewares.use("/api/check-site", async (req, res) => {
        try {
          const url = new URL(req.url, "http://localhost");
          const site = url.searchParams.get("site");
          if (!site) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "missing ?site=" }));
            return;
          }
          const { checkSite } = await server.ssrLoadModule("/src/lib/checkSite.js");
          const result = await checkSite(site);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}
