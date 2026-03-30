import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "./AuthModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { session, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("logout clicked");
    await logout();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/">RecruitFlow</Link>

        <div className="nav-actions">
          {/* Theme always visible */}
          <ThemeToggle />

          {session ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/create-job">Create Job</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowModal(true)}>
              Login
            </button>
          )}
        </div>
      </nav>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default Navbar;