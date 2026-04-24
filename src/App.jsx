import { useState, useEffect } from "react";
import { ThemeProvider, tokens } from "./lib/theme.jsx";
import { supabase } from "./lib/supabase.js";
import { LoginPage } from "./components/LoginPage.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";
import { TeacherPanel } from "./components/TeacherPanel.jsx";
import { PublicFormPage } from "./components/StudentForm.jsx";
import { ResetPassword } from "./components/ResetPassword.jsx";

// Inject global CSS
if (typeof document !== "undefined" && !document.getElementById("em-global-styles")) {
  const style = document.createElement("style");
  style.id = "em-global-styles";
  style.textContent = tokens.css;
  document.head.appendChild(style);
}

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const h = () => setHash(window.location.hash);
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [isRecovering, setIsRecovering] = useState(false);
  const [user, setUser] = useState(() => {
    try { 
      const s = sessionStorage.getItem("edumarks_user"); 
      return s ? JSON.parse(s) : null; 
    } catch { return null; }
  });

  useEffect(() => {
    // 1. Check for Expired Link parameters in URL immediately
    const params = new URLSearchParams(window.location.hash.substring(1));
    if (params.get("error_code") === "otp_expired" || params.get("error") === "access_denied") {
      setIsRecovering(true);
    }

    // 2. Load SheetJS Dynamically
    if (!window.XLSX) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.async = true;
      document.head.appendChild(s);
    }

    // 3. Listen for Supabase Recovery Event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (u) => { 
    sessionStorage.setItem("edumarks_user", JSON.stringify(u)); 
    setUser(u); 
  };
  
  const handleLogout = () => { 
    sessionStorage.removeItem("edumarks_user"); 
    setUser(null); 
    window.location.hash = "#/";
  };

  const formMatch = hash.match(/^#\/form\/([A-Z0-9]+)$/);

  return (
    <ThemeProvider key={hash}>
      {isRecovering ? (
        <ResetPassword onComplete={() => {
          setIsRecovering(false);
          window.location.hash = "#/";
        }} />
      ) : (
        <>
          {formMatch ? (
            <PublicFormPage slug={formMatch[1]} />
          ) : (
            <>
              {!user && <LoginPage onLogin={handleLogin} />}
              {user?.role === "admin" && <AdminPanel user={user} onLogout={handleLogout} />}
              {user?.role === "teacher" && <TeacherPanel user={user} onLogout={handleLogout} />}
            </>
          )}
        </>
      )}
    </ThemeProvider>
  );
}