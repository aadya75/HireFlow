import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Apply = () => {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);

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
  if (!file) {
    alert("Upload resume");
    return;
  }

  const fileName = `${Date.now()}-${file.name}`;

  const { data: uploadData, error: uploadError } =
    await supabase.storage.from("resumes").upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError.message);
    return;
  }

  const { data: urlData } = supabase
    .storage
    .from("resumes")
    .getPublicUrl(uploadData.path);

  const { error: insertError } = await supabase
    .from("candidates")
    .insert({
      job_id: jobId,
      name,
      email,
      resume_url: urlData.publicUrl,
    });

  if (insertError) {
    console.error("Insert error:", insertError.message);
    return;
  }

  alert("Applied successfully!");
};

  if (!job) return <p>Loading...</p>;

  return (
    <div className="container">
      <h2>{job.title}</h2>
      <p>{job.description}</p>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={handleSubmit}>Apply</button>
    </div>
  );
};

export default Apply;