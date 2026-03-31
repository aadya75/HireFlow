import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const CreateJob = () => {
  const { session } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleCreate = async () => {
    if (!deadline) {
      alert("Please set a deadline.");
      return;
    }

    if (deadline < new Date().toISOString().split("T")[0]) {
      alert("Deadline cannot be in the past.");
      return;
    }

    const { data } = await supabase
      .from("jobs")
      .insert({
        title,
        description,
        deadline,
        recruiter_id: session.user.id,
      })
      .select()
      .single();

    if (data) {
      const link = `${window.location.origin}/apply/${data.id}`;
      alert(`Job link generated: \n${link}`);
    } else {
      alert("Failed to create job, make sure the deadline column exists in your database table.");
    }
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

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label">Application Deadline</label>
          <input
            type={deadline ? "date" : "text"}
            placeholder="Select Date"
            min={new Date().toISOString().split("T")[0]}
            onFocus={(e) => {
              e.target.type = "date";
              e.target.showPicker && e.target.showPicker();
            }}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text";
            }}
            onClick={(e) => {
              e.target.type = "date";
              e.target.showPicker && e.target.showPicker();
            }}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "inherit",
              fontFamily: "inherit",
              cursor: "pointer"
            }}
            onChange={(e) => setDeadline(e.target.value)}
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
