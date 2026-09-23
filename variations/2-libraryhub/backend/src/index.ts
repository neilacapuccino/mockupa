// server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./authRoutes";
import bookRoutes from "./bookRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}/`);
});

app.get("/", (_req, res) => {
  res.send("hello from LibraryHub server");
});
