import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateJob from "./pages/CreateJob";
import Apply from "./pages/Apply";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create-job" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
        <Route path="/apply/:jobId" element={<Apply />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;