// server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./authRoutes";
import noteRoutes from "./noteRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}/`);
});

app.get("/", (_req, res) => {
  res.send("hello from StudyNotes server");
});
