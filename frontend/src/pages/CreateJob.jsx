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
    alert(link);
  };

  return (
    <div className="container">
      <h2>Create Job</h2>
      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
};

export default CreateJob;