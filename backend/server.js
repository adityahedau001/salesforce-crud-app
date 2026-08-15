require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const authRoutes = require("./routes/auth");
const recordRoutes = require("./routes/records");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "sf_session",
    secret: process.env.SESSION_SECRET,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
);

app.use("/auth", authRoutes);
app.use("/api", recordRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.message, err.details || "");
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SF CRUD backend listening on port ${PORT}`));
