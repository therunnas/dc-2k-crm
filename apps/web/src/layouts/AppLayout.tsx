import { NavLink, Outlet } from "react-router-dom";
import {
  Bot,
  CalendarDays,
  CircleDollarSign,
  Disc3,
  FileText,
  Film,
  LayoutDashboard,
  Users
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Produções", path: "/producoes", icon: Film },
  { label: "Financeiro", path: "/financeiro", icon: CircleDollarSign },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Reuniões", path: "/reunioes", icon: CalendarDays },
  { label: "Discord", path: "/discord", icon: Disc3 },
  { label: "Obsidian", path: "/obsidian", icon: FileText },
  { label: "Automações", path: "/automacoes", icon: Bot }
];

export function AppLayout() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">2K</div>

          <div>
            <strong>2K Command OS</strong>
            <span>Internal Studio System</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        <Outlet />
      </section>
    </main>
  );
}