import { useState } from "react";
import { api } from "../services/api";

export function Obsidian() {
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("00 - Inbox");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  async function handleCreateNote(event: React.FormEvent) {
    event.preventDefault();

    setStatus("Criando nota...");

    try {
      const response = await api.post("/api/obsidian/note", {
        title,
        folder,
        content
      });

      setStatus(`Nota criada com sucesso: ${response.data.file}`);
      setTitle("");
      setContent("");
    } catch {
      setStatus("Erro ao criar nota. Verifique se o backend está rodando.");
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">Obsidian</p>
      <h1>Obsidian</h1>
      <p>
        Crie notas Markdown automaticamente dentro da estrutura documental da
        2K Studios.
      </p>

      <form className="form-card" onSubmit={handleCreateNote}>
        <label>
          Título da nota
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Reunião com cliente XPTO"
            required
          />
        </label>

        <label>
          Pasta
          <select
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
          >
            <option>00 - Inbox</option>
            <option>01 - Diário Operacional</option>
            <option>02 - Clientes</option>
            <option>03 - Produções</option>
            <option>04 - Financeiro</option>
            <option>05 - Reuniões</option>
            <option>06 - Automações</option>
          </select>
        </label>

        <label>
          Conteúdo
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Digite o conteúdo da nota..."
            rows={10}
            required
          />
        </label>

        <button type="submit">Criar nota Markdown</button>

        {status && <div className="status-box">{status}</div>}
      </form>
    </section>
  );
}