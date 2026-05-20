import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

const OBSIDIAN_ROOT = path.join(process.cwd(), "..", "..", "obsidian-vault");
const TASKS_FILE = path.join(process.cwd(), "data", "tasks.json");

type Task = {
  id: string;
  title: string;
  area: string;
  priority: "Baixa" | "Média" | "Alta";
  status: "Pendente" | "Em andamento" | "Concluída";
  createdAt: string;
};

function readTasks(): Task[] {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, "[]", "utf-8");
  }

  const data = fs.readFileSync(TASKS_FILE, "utf-8");
  return JSON.parse(data);
}

function writeTasks(tasks: Task[]) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

app.get("/", (_req, res) => {
  res.json({
    app: "2K Command OS API",
    status: "online"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "online"
  });
});

app.get("/api/tasks", (_req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title, area, priority } = req.body;

  if (!title || !area || !priority) {
    return res.status(400).json({
      error: "Campos obrigatórios: title, area e priority."
    });
  }

  const tasks = readTasks();

  const newTask: Task = {
    id: crypto.randomUUID(),
    title,
    area,
    priority,
    status: "Pendente",
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  writeTasks(tasks);

  return res.status(201).json(newTask);
});

app.patch("/api/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const tasks = readTasks();
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Tarefa não encontrada."
    });
  }

  task.status = status;
  writeTasks(tasks);

  return res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  const tasks = readTasks();
  const filteredTasks = tasks.filter((item) => item.id !== id);

  if (tasks.length === filteredTasks.length) {
    return res.status(404).json({
      error: "Tarefa não encontrada."
    });
  }

  writeTasks(filteredTasks);

  return res.json({
    success: true
  });
});

app.post("/api/obsidian/note", async (req, res) => {
  try {
    const { title, content, folder } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Título e conteúdo obrigatórios"
      });
    }

    const safeFolder = folder || "00 - Inbox";
    const folderPath = path.join(OBSIDIAN_ROOT, safeFolder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const safeTitle = String(title).replace(/[<>:"/\\|?*]/g, "");
    const filePath = path.join(folderPath, `${safeTitle}.md`);

    const markdown = `# ${title}

${content}

---
Criado pelo 2K Command OS
`;

    fs.writeFileSync(filePath, markdown, "utf-8");

    return res.json({
      success: true,
      file: filePath
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno ao criar nota"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server online em http://localhost:${PORT}`);
});