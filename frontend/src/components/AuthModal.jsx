import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const AuthModal = ({ onClose }) => {
  const { signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg("");

    // basic validation
    if (!email || !password) {
      return setErrorMsg("Email & password required");
    }

    if (password.length < 6) {
      return setErrorMsg("Password must be at least 6 characters");
    }

    setLoading(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
          {isLogin
            ? "Sign in to access your dashboard"
            : "Join us to manage candidates efficiently"}
        </p>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMsg && (
          <p
            style={{
              color: "#ef4444",
              fontSize: "0.9rem",
              padding: "0.5rem",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {errorMsg}
          </p>
        )}

        <button
          className="btn btn-primary"
          style={{ marginTop: "1rem" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isLogin
              ? "Login to Account"
              : "Create Account"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          style={{
            cursor: "pointer",
            textAlign: "center",
            marginTop: "0.5rem",
            color: "var(--brand-primary)",
            fontWeight: "500",
          }}
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
