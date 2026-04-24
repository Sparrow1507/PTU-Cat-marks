import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { GlassCard, Btn, Label, Alert } from "./UI.jsx";
import { CheckCircle, Eye, EyeOff, ShieldCheck, XCircle, RefreshCw } from "lucide-react";

export function ResetPassword({ onComplete }) {
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Check URL for error params
      const params = new URLSearchParams(window.location.hash.substring(1));
      const hasError = params.get("error_code") === "otp_expired" || params.get("error") === "access_denied";

      if (hasError) {
        setExpired(true);
      } else {
        // Double check session
        const { data } = await supabase.auth.getSession();
        if (!data.session) setExpired(true);
      }
      setValidating(false);
    };
    checkStatus();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (pass.length < 6) return setError("Password must be at least 6 characters.");
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    
    if (error) {
      if (error.message.includes("expired")) setExpired(true);
      else setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  };

  if (validating) return <div style={styles.wrapper}><p>Validating link...</p></div>;

  if (expired) return (
    <div style={styles.wrapper}>
      <GlassCard style={styles.card} className="fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...styles.iconCircle, background: 'rgba(239, 68, 68, 0.1)' }}>
            <XCircle size={40} color="#ef4444" />
          </div>
          <h2 style={styles.title}>Link Expired</h2>
          <p style={styles.subtitle}>This reset link is invalid or has expired. Please request a new one.</p>
          <Btn variant="primary" onClick={onComplete} style={styles.submitBtn}>
            <RefreshCw size={18} style={{marginRight: '8px'}} /> Request New Link
          </Btn>
        </div>
      </GlassCard>
    </div>
  );

  if (done) return (
    <div style={styles.wrapper}>
      <GlassCard style={styles.card} className="fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={styles.iconCircle}>
            <CheckCircle size={40} color="#4ade80" />
          </div>
          <h2 style={styles.title}>Password Updated</h2>
          <p style={styles.subtitle}>Your account is now secure. Log in with your new password.</p>
          <Btn variant="primary" onClick={onComplete} style={styles.submitBtn}>
            Back to Login
          </Btn>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <GlassCard style={styles.card} className="fade-in">
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <ShieldCheck size={40} color="var(--accent)" />
          </div>
          <h2 style={styles.title}>New Password</h2>
          <p style={styles.subtitle}>Please enter a strong password to secure your account.</p>
        </div>

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: "20px" }}>
            <Label>New Password</Label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input 
                type={showPass ? "text" : "password"} 
                value={pass} 
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                required 
                style={{ width: "100%", paddingRight: "45px" }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}
          <Btn variant="primary" type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Updating..." : "Update Password"}
          </Btn>
        </form>
      </GlassCard>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-base)', padding: '20px' },
  card: { padding: '40px', width: '100%', maxWidth: '400px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  iconCircle: { width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  title: { fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' },
  subtitle: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' },
  eyeBtn: { position: "absolute", right: "12px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" },
  submitBtn: { width: "100%", padding: "14px", marginTop: "10px", justifyContent: "center", display: 'flex', alignItems: 'center', fontSize: "15px", fontWeight: "700" }
};