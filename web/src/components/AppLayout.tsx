import { NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";
import clsx from "clsx";
import { useUIStore } from "../state/uiStore";
import { ToastHost } from "./ToastHost";

const NAV_LINKS = [
  { to: "/conversation", label: "Conversation" },
  { to: "/manager", label: "Voice & Data" },
  { to: "/settings", label: "Settings" },
];

function AppLayout({ children }: PropsWithChildren) {
  const lastCleanupRun = useUIStore((state) => state.lastCleanupRun);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <p className="logo">Indexed Speech Studio</p>
            <p className="logo-subtitle">
              Client-only experiments powered by Gemini + Azure
            </p>
          </div>

          <nav className="nav-links">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx("nav-link", { "nav-link-active": isActive })
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pill">
            {lastCleanupRun
              ? `Last cleanup ${new Date(lastCleanupRun).toLocaleTimeString()}`
              : "Cleanup pending"}
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>
      <ToastHost />
    </div>
  );
}

export default AppLayout;
