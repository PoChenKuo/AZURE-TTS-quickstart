import { NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useUIStore } from "../state/uiStore";
import { ToastHost } from "./ToastHost";
import { LANG_OPTIONS } from "../i18n";

const NAV_LINKS = [
  { to: "/conversation", key: "app.nav.conversation" },
  { to: "/manager", key: "app.nav.voice" },
  { to: "/settings", key: "app.nav.settings" },
];

function AppLayout({ children }: PropsWithChildren) {
  const lastCleanupRun = useUIStore((state) => state.lastCleanupRun);
  const { t, i18n } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <p className="logo">{t("app.title")}</p>
            <p className="logo-subtitle">{t("app.subtitle")}</p>
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
                {t(link.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-slate-300">
              <span>{t("app.language")}</span>
              <select
                className="language-select rounded-full border border-white/20 px-2 py-1 text-xs focus:outline-none"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                {LANG_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="pill">
              {lastCleanupRun
                ? t("app.cleanup.last", {
                    time: new Date(lastCleanupRun).toLocaleTimeString(),
                  })
                : t("app.cleanup.pending")}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>
      <ToastHost />
    </div>
  );
}

export default AppLayout;
