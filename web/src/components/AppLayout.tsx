import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [isCompact, setIsCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(max-width: 800px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsCompact(event.matches);
    };
    handleChange(mediaQuery);
    const listener = (event: MediaQueryListEvent) => handleChange(event);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, []);

  useEffect(() => {
    if (!isCompact) {
      setMenuOpen(false);
    }
  }, [isCompact]);

  const showMenuContents = !isCompact || menuOpen;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title-row">
            <div>
              <p className="logo">{t("app.title")}</p>
              <p className="logo-subtitle">{t("app.subtitle")}</p>
            </div>
            {isCompact && (
              <button
                type="button"
                className="header-menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="app-header-menu"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <span className="sr-only">
                  {menuOpen ? "Close navigation menu" : "Open navigation menu"}
                </span>
                <span aria-hidden="true">{menuOpen ? "×" : "≡"}</span>
              </button>
            )}
          </div>

          {showMenuContents && (
            <div
              id="app-header-menu"
              className={clsx("header-controls", {
                "header-controls-mobile text-right": isCompact,
              })}
            >
              <nav className="nav-links">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      clsx("nav-link", { "nav-link-active": isActive })
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(link.key)}
                  </NavLink>
                ))}
              </nav>

              <div className="header-meta">
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
          )}
        </div>
      </header>

      <main className="app-main mb-2 ml-auto mr-auto mt-1 md:mt-4  md:mt-2 md:mb-2">{children}</main>
      <ToastHost />
    </div>
  );
}

export default AppLayout;
