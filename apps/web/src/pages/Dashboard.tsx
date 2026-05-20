import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Disc3,
  Plus
} from "lucide-react";

type DiscordWidget = {
  name: string;
  presence_count: number;
  members: Array<{
    id: string;
    username: string;
    status: string;
    avatar_url: string;
  }>;
};

type Task = {
  id: string;
  title: string;
  area: string;
  priority: string;
  status: "Pendente" | "Em andamento" | "Concluída";
};

const DISCORD_WIDGET_URL =
  "https://discord.com/api/guilds/833527993409339462/widget.json";

export function Dashboard() {
  const [discord, setDiscord] = useState<DiscordWidget | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Operacional");
  const [priority, setPriority] = useState("Média");
  const [message, setMessage] = useState("");
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((task) => task.status === "Pendente").length;
  const progressTasks = tasks.filter((task) => task.status === "Em andamento").length;
  const completedTasks = tasks.filter((task) => task.status === "Concluída").length;

  async function loadTasks() {
    try {
      const response = await api.get("/api/tasks");
      setTasks(response.data);
    } catch {
      setMessage("Erro ao carregar tarefas. Verifique se o backend está rodando.");
    }
  }

  async function createTask(event: React.FormEvent) {
    event.preventDefault();

    try {
      await api.post("/api/tasks", {
        title,
        area,
        priority
      });

      setTitle("");
      setMessage("Tarefa criada com sucesso.");
      await loadTasks();
    } catch {
      setMessage("Erro ao criar tarefa. Verifique o backend em localhost:3333.");
    }
  }

  async function updateTaskStatus(taskId: string, status: Task["status"]) {
    await api.patch(`/api/tasks/${taskId}/status`, { status });
    await loadTasks();
  }

  async function deleteTask(taskId: string) {
    await api.delete(`/api/tasks/${taskId}`);
    await loadTasks();
  }

  useEffect(() => {
    loadTasks();

    async function loadDiscordWidget() {
      try {
        const response = await fetch(DISCORD_WIDGET_URL);
        const data = await response.json();
        setDiscord(data);
      } catch {
        console.error("Erro ao carregar Discord Widget");
      }
    }

    loadDiscordWidget();
  }, []);

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">2K Studios Workspace</p>
          <h1>Sistema operacional interno para produção, gestão e automação.</h1>
          <p>
            Painel operacional da 2K Studios integrado com Discord, Obsidian e
            automações internas.
          </p>
        </div>

        <div className="hero-card">
          <Activity size={28} />
          <span>Status do sistema</span>
          <strong>ONLINE</strong>
        </div>
      </header>

      <section className="stats-grid">
  <div className="stat-card">
    <span>Total</span>
    <strong>{totalTasks}</strong>
  </div>

  <div className="stat-card">
    <span>Pendentes</span>
    <strong>{pendingTasks}</strong>
  </div>

  <div className="stat-card">
    <span>Em andamento</span>
    <strong>{progressTasks}</strong>
  </div>

  <div className="stat-card">
    <span>Concluídas</span>
    <strong>{completedTasks}</strong>
  </div>
 </section>

      <section className="grid two-columns">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Discord</p>
              <h2>Status do servidor</h2>
            </div>
            <Disc3 />
          </div>

          {discord && (
            <>
              <div className="discord-status">
                <div>
                  <span>Servidor</span>
                  <strong>{discord.name}</strong>
                </div>
                <div>
                  <span>Online agora</span>
                  <strong>{discord.presence_count}</strong>
                </div>
              </div>

              <div className="member-list">
                {discord.members.slice(0, 5).map((member) => (
                  <div className="member" key={member.id}>
                    <img src={member.avatar_url} alt={member.username} />
                    <div>
                      <strong>{member.username}</strong>
                      <span>{member.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Nova tarefa</p>
              <h2>Criar tarefa operacional</h2>
            </div>
            <Plus />
          </div>

          <form className="task-form" onSubmit={createTask}>
            <input
              placeholder="Título da tarefa"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <select value={area} onChange={(event) => setArea(event.target.value)}>
              <option>Operacional</option>
              <option>Produção</option>
              <option>Financeiro</option>
              <option>Clientes</option>
              <option>Discord</option>
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
            </select>

            <button type="submit">Criar tarefa</button>

            {message && <div className="status-box">{message}</div>}
          </form>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Tarefas</p>
            <h2>Painel operacional</h2>
          </div>
          <ClipboardList />
        </div>

        <div className="task-list">
          {tasks.map((task) => (
            <div className="task task-row" key={task.id}>
              <CheckCircle2 size={18} />

              <div className="task-main">
                <strong>{task.title}</strong>
                <span>
                  {task.area} · {task.priority} · {task.status}
                </span>
              </div>

              <div className="task-actions">
                <button onClick={() => updateTaskStatus(task.id, "Pendente")}>
                  Pendente
                </button>
                <button onClick={() => updateTaskStatus(task.id, "Em andamento")}>
                  Em andamento
                </button>
                <button onClick={() => updateTaskStatus(task.id, "Concluída")}>
                  Concluída
                </button>
                <button className="danger" onClick={() => deleteTask(task.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {!tasks.length && (
            <div className="task">
              <div>
                <strong>Nenhuma tarefa criada</strong>
                <span>Crie a primeira tarefa operacional.</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}