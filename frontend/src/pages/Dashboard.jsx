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
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
              {job.title}
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              {job.description}
            </p>
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
