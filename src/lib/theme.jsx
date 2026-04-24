import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("edumarks_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("edumarks_theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// All components consume CSS variables set in index.css per [data-theme]
// This keeps inline styles minimal and theme-aware.
export const tokens = {
  // Inject into <head> via App — prevents FOUC
  css: `
    :root, [data-theme="dark"] {
      --bg-base:        #0d0d14;
      --bg-surface:     #13131f;
      --bg-elevated:    #1a1a2e;
      --bg-glass:       rgba(255,255,255,0.05);
      --bg-glass-hover: rgba(255,255,255,0.08);
      --border:         rgba(255,255,255,0.09);
      --border-focus:   rgba(102,126,234,0.6);
      --text-primary:   #e8eaf6;
      --text-secondary: #8892b0;
      --text-muted:     #4a5568;
      --accent:         #667eea;
      --accent-2:       #764ba2;
      --success:        #43e97b;
      --danger:         #f64f59;
      --warning:        #f7971e;
      --shadow:         0 4px 24px rgba(0,0,0,0.4);
      --shadow-lg:      0 8px 48px rgba(0,0,0,0.6);
      --input-bg:       rgba(255,255,255,0.05);
      --sidebar-bg:     rgba(13,13,20,0.95);
    }
    [data-theme="light"] {
      --bg-base:        #f0f2ff;
      --bg-surface:     #ffffff;
      --bg-elevated:    #eef0fb;
      --bg-glass:       rgba(255,255,255,0.75);
      --bg-glass-hover: rgba(255,255,255,0.9);
      --border:         rgba(102,126,234,0.15);
      --border-focus:   rgba(102,126,234,0.5);
      --text-primary:   #1a1a2e;
      --text-secondary: #4a5568;
      --text-muted:     #8892b0;
      --accent:         #5a67d8;
      --accent-2:       #6b46c1;
      --success:        #27ae60;
      --danger:         #e53e3e;
      --warning:        #d97706;
      --shadow:         0 4px 24px rgba(90,103,216,0.10);
      --shadow-lg:      0 8px 48px rgba(90,103,216,0.15);
      --input-bg:       rgba(102,126,234,0.06);
      --sidebar-bg:     rgba(240,242,255,0.97);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh;
      transition: background 0.3s, color 0.3s;
    }

    input, textarea, select {
      background: var(--input-bg) !important;
      color: var(--text-primary) !important;
      border: 1px solid var(--border) !important;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      width: 100%;
      outline: none;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--border-focus) !important;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.12);
    }
    input::placeholder, textarea::placeholder {
      color: var(--text-muted);
    }
    select option {
      background: var(--bg-surface);
      color: var(--text-primary);
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:none; } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    .fade-in { animation: fadeIn 0.3s ease both; }
    .slide-in { animation: slideIn 0.25s ease both; }

    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  `,
};
