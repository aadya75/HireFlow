import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import AgentLogs from "../components/AgentLogs";

const Dashboard = () => {
  const { session } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [candidates, setCandidates] = useState({});
  const [loadingCandidates, setLoadingCandidates] = useState({});
  const [processingJobs, setProcessingJobs] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const data = await api.getJobs(session);
        setJobs(data || []);
      } catch (error) {
        console.error("Fetch jobs error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [session]);

  const fetchCandidates = async (jobId) => {
    setLoadingCandidates(prev => ({ ...prev, [jobId]: true }));
    try {
      const data = await api.getJobCandidates(jobId, session);
      console.log(`Fetched candidates for job ${jobId}:`, data);
      setCandidates(prev => ({ ...prev, [jobId]: data || [] }));
    } catch (error) {
      console.error("Fetch candidates error:", error);
    } finally {
      setLoadingCandidates(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleToggleExpand = async (jobId) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      // Always refresh candidates when expanding
      await fetchCandidates(jobId);
    }
  };

  const handleProcessJob = async (jobId) => {
    setProcessingJobs(prev => ({ ...prev, [jobId]: true }));
    try {
      const result = await api.processJob(jobId, session);
      alert(result.response || "Processing started");
      
      // Poll for candidate updates every 3 seconds for 30 seconds
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(async () => {
        attempts++;
        await fetchCandidates(jobId);
        const jobCandidates = candidates[jobId] || [];
        const hasScores = jobCandidates.some(c => c.screening_score !== null);
        if (hasScores || attempts >= maxAttempts) {
          clearInterval(interval);
          if (hasScores) {
            alert("Processing complete! Candidate scores are now available.");
          }
        }
      }, 3000);
      
    } catch (error) {
      console.error("Process job error:", error);
      alert(error.message || "Failed to process job");
    } finally {
      setProcessingJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const openFeedbackModal = (candidate) => {
    setSelectedCandidate(candidate);
    setShowFeedbackModal(true);
    setFeedbackReason("");
    setFeedbackDecision("");
  };

  const submitFeedback = async () => {
    if (!feedbackDecision) {
      alert("Please select Accept or Reject");
      return;
    }
    if (!feedbackReason) {
      alert("Please provide a reason");
      return;
    }

    try {
      const decision = feedbackDecision === "accept" ? "accept" : "reject";
      await api.submitFeedback(expandedJob, {
        candidate_id: selectedCandidate.id,
        decision: decision,
        reason: feedbackReason
      }, session);
      
      // Refresh candidates to show updated status
      await fetchCandidates(expandedJob);
      setShowFeedbackModal(false);
      alert(`Candidate ${decision === "accept" ? "shortlisted" : "rejected"} successfully. Thank you for your feedback!`);
      
    } catch (error) {
      console.error("Feedback error:", error);
      alert("Failed to submit feedback");
    }
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return "#4caf50";
    if (score >= 40) return "#ff9800";
    return "#f44336";
  };

  const getStatusDisplay = (status, score) => {
    if (status === "shortlist") {
      return { text: "Shortlisted", color: "#4caf50", bg: "rgba(76, 175, 80, 0.2)" };
    }
    if (status === "pending_review" || (score >= 40 && score < 80)) {
      return { text: "Needs Review", color: "#ff9800", bg: "rgba(255, 152, 0, 0.2)" };
    }
    if (status === "rejected") {
      return { text: "Rejected", color: "#f44336", bg: "rgba(244, 67, 54, 0.2)" };
    }
    return { text: "Pending", color: "#888", bg: "rgba(136, 136, 136, 0.2)" };
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "5rem 0" }}>
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2.5rem", margin: 0 }}>Your Jobs</h2>
        <a href="/create-job" className="btn btn-primary">Create New</a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p>No jobs created yet.</p>
            <a href="/create-job" className="btn btn-primary">Create Your First Job</a>
          </div>
        ) : (
          jobs.map((job) => {
            const deadlinePassed = isDeadlinePassed(job.deadline);
            const isExpanded = expandedJob === job.id;
            const jobCandidates = candidates[job.id] || [];
            const isLoadingCandidates = loadingCandidates[job.id];
            const isProcessing = processingJobs[job.id];
            const isProcessed = job.processed;

            return (
              <div key={job.id} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "0.75rem" }}>
                <div onClick={() => handleToggleExpand(job.id)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: "0.5rem" }}>{job.title}</h3>
                      <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        {job.description?.substring(0, 150)}
                        {job.description?.length > 150 ? "..." : ""}
                      </p>
                      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        {job.deadline && (
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            Deadline: {new Date(job.deadline).toLocaleString()}
                          </span>
                        )}
                        <span style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "1rem",
                          backgroundColor: deadlinePassed ? "rgba(255, 77, 77, 0.1)" : "rgba(76, 175, 80, 0.1)",
                          color: deadlinePassed ? "#ff4d4d" : "#4caf50",
                        }}>
                          {deadlinePassed ? (isProcessed ? "Processed" : "Closed") : "Active"}
                        </span>
                        {jobCandidates.length > 0 && (
                          <span style={{
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "1rem",
                            backgroundColor: "rgba(33, 150, 243, 0.1)",
                            color: "#2196f3",
                          }}>
                            {jobCandidates.length} candidate(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/apply/${job.id}`);
                        }}
                      >
                        Copy Link
                      </button>
                      {deadlinePassed && !isProcessed && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessJob(job.id);
                          }}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing..." : "Process"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                    <h4 style={{ marginBottom: "1rem" }}>Candidates</h4>
                    
                    {isLoadingCandidates ? (
                      <p style={{ textAlign: "center", padding: "2rem" }}>Loading candidates...</p>
                    ) : jobCandidates.length === 0 ? (
                      <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                        No candidates have applied yet.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {jobCandidates.map((candidate) => {
                          const statusDisplay = getStatusDisplay(candidate.screening_status, candidate.screening_score);
                          const needsReview = candidate.screening_status === "pending_review" || 
                                             (candidate.screening_score >= 40 && candidate.screening_score < 80);
                          
                          return (
                            <div
                              key={candidate.id}
                              style={{
                                padding: "1rem",
                                borderRadius: "0.5rem",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                                <div>
                                  <strong>{candidate.name}</strong>
                                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "1rem" }}>
                                    {candidate.email}
                                  </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                  {candidate.screening_score && (
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "1rem",
                                        backgroundColor: getScoreBadgeColor(candidate.screening_score),
                                        color: "white",
                                        fontSize: "0.85rem",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Score: {candidate.screening_score}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: "0.75rem",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "0.25rem",
                                    backgroundColor: statusDisplay.bg,
                                    color: statusDisplay.color,
                                  }}>
                                    {statusDisplay.text}
                                  </span>
                                </div>
                              </div>
                              
                              {candidate.resume_url && (
                                <div style={{ marginTop: "0.5rem" }}>
                                  <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "#2196f3" }}>
                                    View Resume
                                  </a>
                                </div>
                              )}
                              
                              {needsReview && candidate.screening_status !== "shortlist" && candidate.screening_status !== "rejected" && (
                                <button
                                  onClick={() => openFeedbackModal(candidate)}
                                  style={{
                                    marginTop: "0.75rem",
                                    padding: "0.4rem 1rem",
                                    backgroundColor: "#ff9800",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.25rem",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Review Decision
                                </button>
                              )}
                              
                              {candidate.feedback_reason && (
                                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                  Feedback: {candidate.feedback_reason}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Agent Logs Section */}
                    <div style={{ marginTop: "2rem" }}>
                      <AgentLogs jobId={job.id} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedCandidate && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div className="glass-panel" style={{ padding: "2rem", borderRadius: "1rem", maxWidth: "500px", width: "90%" }}>
            <h3 style={{ marginBottom: "1rem", color: "#ff9800" }}>Review Candidate</h3>
            <p><strong>Name:</strong> {selectedCandidate.name}</p>
            <p><strong>Email:</strong> {selectedCandidate.email}</p>
            <p><strong>AI Score:</strong> {selectedCandidate.screening_score}</p>
            <p><strong>AI Reasoning:</strong> {selectedCandidate.screening_details?.reasoning || "No reasoning available"}</p>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Decision:</label>
              <div style={{ display: "flex", gap: "2rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    value="accept"
                    checked={feedbackDecision === "accept"}
                    onChange={(e) => setFeedbackDecision(e.target.value)}
                  />
                  <span style={{ color: "#4caf50" }}>✅ Accept (Shortlist)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    value="reject"
                    checked={feedbackDecision === "reject"}
                    onChange={(e) => setFeedbackDecision(e.target.value)}
                  />
                  <span style={{ color: "#f44336" }}>❌ Reject</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Reason for Decision:</label>
              <textarea
                rows="3"
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                placeholder="e.g., Missing required skills, excellent experience, poor communication, great culture fit..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "inherit",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
              <small style={{ color: "var(--text-secondary)", fontSize: "0.7rem", display: "block", marginTop: "0.5rem" }}>
                This feedback helps our AI learn and improve future screening
              </small>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowFeedbackModal(false)}
                style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitFeedback}
                style={{ padding: "0.5rem 1rem", cursor: "pointer", backgroundColor: "#ff9800", borderColor: "#ff9800" }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;