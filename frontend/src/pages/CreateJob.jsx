import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const CreateJob = () => {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!deadlineDate) {
      alert("Please set a deadline date.");
      return;
    }

    const deadlineDateTime = `${deadlineDate}T${deadlineTime}:00`;
    
    if (new Date(deadlineDateTime) < new Date()) {
      alert("Deadline cannot be in the past.");
      return;
    }

    setLoading(true);

    try {
      const data = await api.createJob(
        {
          title,
          description,
          deadline: deadlineDateTime,
        },
        session
      );

      const link = `${window.location.origin}/apply/${data.id}`;
      alert(`Job created successfully!\n\nApplication link:\n${link}`);
    } catch (error) {
      console.error("Create job error:", error);
      alert(error.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <div
        className="glass-panel"
        style={{
          padding: "3rem",
          borderRadius: "1rem",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <h2
          className="title"
          style={{ fontSize: "2rem", marginBottom: "1.5rem" }}
        >
          Create New Job Listing
        </h2>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Job Title</label>
          <input
            placeholder="e.g. Senior Frontend Engineer"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label">Job Description</label>
          <textarea
            rows="5"
            placeholder="Describe the responsibilities and requirements..."
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Deadline Date</label>
          <input
            type="date"
            min={today}
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "inherit",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label">Deadline Time</label>
          <input
            type="time"
            value={deadlineTime}
            onChange={(e) => setDeadlineTime(e.target.value)}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "inherit",
              fontFamily: "inherit",
            }}
          />
          <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            Applications will close at this time on the selected date
          </small>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.8rem" }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create and Generate Link"}
        </button>
      </div>
    </div>
  );
};

export default CreateJob;