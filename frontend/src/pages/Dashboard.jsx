import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { session } = useAuth();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", session.user.id);

      setJobs(data || []);
    };

    if (session) fetchJobs();
  }, [session]);

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 className="title" style={{ fontSize: "2.5rem", margin: 0 }}>
          Your Jobs
        </h2>
        <a href="/create-job" className="btn btn-primary">
          Create New
        </a>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{job.title}</span>
              {job.deadline && (
                <span style={{
                  fontSize: "0.8rem",
                  fontWeight: "normal",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "1rem",
                  backgroundColor: new Date(new Date(job.deadline).setHours(23, 59, 59, 999)) < new Date() ? "rgba(255, 77, 77, 0.1)" : "rgba(76, 175, 80, 0.1)",
                  color: new Date(new Date(job.deadline).setHours(23, 59, 59, 999)) < new Date() ? "var(--error-color, #ff4d4d)" : "var(--success-color, #4caf50)",
                }}>
                  {new Date(new Date(job.deadline).setHours(23, 59, 59, 999)) < new Date() ? "Closed" : "Active"}
                </span>
              )}
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              {job.description}
            </p>
            {job.deadline && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem", opacity: 0.8 }}>
                Deadline: {new Date(job.deadline).toLocaleDateString()}
              </p>
            )}
            <div
              style={{
                marginTop: "auto",
                paddingTop: "1rem",
                borderTop: "1px dashed var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                className="muted"
                style={{
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "200px",
                }}
              >
                {window.location.origin}/apply/{job.id}
              </span>
              <button
                className="btn btn-outline"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/apply/${job.id}`,
                  )
                }
              >
                Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
