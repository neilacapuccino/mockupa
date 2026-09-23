// server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./authRoutes";
import projectRoutes from "./projectRoutes";
import taskRoutes from "./taskRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);   // also has POST /api/projects/:projectId/tasks
app.use("/api/tasks", taskRoutes);         // PATCH + DELETE one task

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}/`);
});

app.get("/", (_req, res) => {
  res.send("hello from ProjectBoard server");
});
