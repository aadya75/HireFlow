import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const CreateJob = () => {
  const { session } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    const { data } = await supabase
      .from("jobs")
      .insert({
        title,
        description,
        recruiter_id: session.user.id,
      })
      .select()
      .single();

    const link = `${window.location.origin}/apply/${data.id}`;
    alert(`Job link generated: \n${link}`);
  };

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

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.8rem" }}
          onClick={handleCreate}
        >
          Create and Generate Link
        </button>
      </div>
    </div>
  );
};

export default CreateJob;
