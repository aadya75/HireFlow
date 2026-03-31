import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Apply = () => {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      setJob(data);
    };

    fetchJob();
  }, []);

  const handleSubmit = async () => {
    if (!file || !name || !email) {
      alert("Please fill all fields and upload resume");
      return;
    }

    setLoading(true);

    const fileName = `${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(uploadData.path);

    const { error: insertError } = await supabase.from("candidates").insert({
      job_id: jobId,
      name,
      email,
      resume_url: urlData.publicUrl,
    });

    setLoading(false);

    if (insertError) {
      console.error("Insert error:", insertError.message);
      return;
    }

    alert("Applied successfully!");
  };

  if (!job)
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "5rem 0" }}
      >
        <p className="subtitle">Loading job details...</p>
      </div>
    );

  const isDeadlinePassed = job.deadline ? new Date(new Date(job.deadline).setHours(23, 59, 59, 999)) < new Date() : false;

  return (
    <>
      {isDeadlinePassed && showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(5px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div className="glass-panel" style={{
            padding: "2.5rem 2rem",
            borderRadius: "1rem",
            maxWidth: "400px",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}>
            <h3 style={{ color: "var(--error-color, #ff4d4d)", fontSize: "1.8rem", marginBottom: "1rem", fontWeight: "bold" }}>
              Time's Up! ⏰
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: "1.5" }}>
              The application window for this position has officially closed. We are no longer accepting new submissions.
            </p>
            <button 
              className="btn btn-outline"
              onClick={() => setShowModal(false)}
              style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

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
        <div
          style={{
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="title"
            style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
          >
            {job.title}
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
            {job.description}
          </p>
          {job.deadline && (
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem", fontWeight: "bold" }}>
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </p>
          )}
        </div>

        {isDeadlinePassed ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <h3 style={{ color: "var(--error-color, #ff4d4d)", fontSize: "1.5rem", marginBottom: "1rem" }}>
              Application Closed
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              The deadline for this job has passed. We are no longer accepting applications.
            </p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
          Submit Your Application
        </h3>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Full Name</label>
          <input
            placeholder="Jane Doe"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label">Email Address</label>
          <input
            type="email"
            placeholder="jane@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <label className="form-label">Resume (PDF, DOCX)</label>
          <input
            type="file"
            style={{
              background: "transparent",
              border: "1px dashed var(--border-color)",
              padding: "1rem",
            }}
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.8rem", fontSize: "1.1rem" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default Apply;
