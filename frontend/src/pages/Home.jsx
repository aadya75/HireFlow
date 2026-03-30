import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container">
      <main
        className="hero glass-panel"
        style={{ marginTop: "2rem", borderRadius: "var(--radius-lg)" }}
      >
        <div className="hero-content">
          <h1 className="title">Agentic Recruitment Workflow</h1>
          <p className="subtitle">
            Create jobs, share links, and manage candidates efficiently with the
            power of highly advanced AI agents acting on your behalf.
          </p>
          <div className="hero-actions">
            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: "0.8rem 1.5rem", fontSize: "1.1rem" }}
            >
              Get Started Free
            </Link>
            <Link
              to="/dashboard"
              className="btn btn-secondary"
              style={{ padding: "0.8rem 1.5rem", fontSize: "1.1rem" }}
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
