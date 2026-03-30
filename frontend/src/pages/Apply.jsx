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
        </div>

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
      </div>
    </div>
  );
};

export default Apply;
