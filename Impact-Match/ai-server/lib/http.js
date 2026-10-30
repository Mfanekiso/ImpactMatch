// Small helpers shared by every endpoint.

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Trim and limit user text before it goes into a prompt.
function clean(value, max = 1500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function setCors(res) {
  // Sign-in is by token (not cookies), so allowing any origin is safe here.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// Wraps an endpoint: CORS, POST-only, JSON body, and friendly JSON errors.
function route(handler) {
  return async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST." });
      return;
    }
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body || "{}");
        } catch {
          throw new HttpError(400, "The request was not valid JSON.");
        }
      }
      const result = await handler({ body: body || {}, headers: req.headers || {} });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
      } else {
        console.error("Unexpected error:", error?.message);
        res.status(500).json({ error: "Something went wrong on the server. Please try again." });
      }
    }
  };
}

module.exports = { HttpError, clean, route };