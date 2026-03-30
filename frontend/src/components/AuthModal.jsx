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
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <button onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Create Account"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          style={{ cursor: "pointer" }}
        >
          {isLogin ? "Create account" : "Already have an account?"}
        </p>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AuthModal;