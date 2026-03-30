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
    <div className="container">
      <h2>Your Jobs</h2>

      {jobs.map((job) => (
        <div key={job.id} className="job-card">
          <p>{job.title}</p>
          <p>{job.description}</p>
          <p className="muted">
            {window.location.origin}/apply/{job.id}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;