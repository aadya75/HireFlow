import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "./AuthModal";
import { useState } from "react";

const Navbar = () => {
  const { session, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isApplyPage = location.pathname.startsWith("/apply");

  const handleLogout = async () => {
    console.log("logout clicked");
    await logout();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar glass-panel">
        <Link to="/" className="nav-brand">
          RecruitFlow
        </Link>

        <div className="nav-actions">
          {/* Theme always visible */}
          <ThemeToggle />

          {!isApplyPage && (
            session ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/create-job" className="btn btn-outline">
                  Create Job
                </Link>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                Login
              </button>
            )
          )}
        </div>
      </nav>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default Navbar;
