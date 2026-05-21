import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Producoes } from "./pages/Producoes";
import { Financeiro } from "./pages/Financeiro";
import { Clientes } from "./pages/Clientes";
import { Agenda } from "./pages/Agenda";
import { Discord } from "./pages/Discord";
import { Obsidian } from "./pages/Obsidian";
import { Automacoes } from "./pages/Automacoes";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/producoes" element={<Producoes />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/discord" element={<Discord />} />
        <Route path="/obsidian" element={<Obsidian />} />
        <Route path="/automacoes" element={<Automacoes />} />
      </Route>
    </Routes>
  );
}