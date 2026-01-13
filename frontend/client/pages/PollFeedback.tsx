import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { pollsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";
import pollsFeedbackImg from "@/images/polls_feedback.png";


type PollFeedbackEntry = {
  _id?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  reason: string;
  improvements?: string;
  concerns?: string;
  rating: number;
  selectedOptionText?: string;
  createdAt?: string;
};

export default function PollFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [reason, setReason] = useState("");
  const [improvements, setImprovements] = useState("");
  const [concerns, setConcerns] = useState("");
  const [rating, setRating] = useState<number>(4);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<PollFeedbackEntry[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  const location = useLocation();
  const selectedOptionText = location.state?.selectedOptionText || "Your choice";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) return;
        const [pollRes, feedbackRes] = await Promise.all([
          pollsAPI.getById(id),
          pollsAPI.getFeedback(id),
        ]);

        if (mounted && pollRes?.success) {
          setPoll(pollRes.data.poll);
        }

        if (mounted) {
          if (feedbackRes?.success) {
            setFeedbackList(feedbackRes.data.feedback || []);
          }
          setLoadingFeedback(false);
        }
      } catch (err: any) {
        console.error("Failed to load poll or feedback:", err);
        if (err?.message) {
          showAlert(err.message, "error");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async () => {
    if (!reason || reason.trim() === "") {
      showAlert("Reason for choice is required", "error");
      return;
    }

    if (!id) return showAlert("Invalid poll ID", "error");

    setSubmitting(true);
    try {
      const payload = {
        reason: reason.trim(),
        improvements: improvements.trim(),
        concerns: concerns.trim(),
        rating,
        selectedOptionText,
      };

      // Submit feedback to polls API
      const res = await pollsAPI.feedback(id, payload);
      if (res?.success) {
        showAlert("Thank you for your feedback!", "success");
        // Refresh feedback list so user can immediately see their entry
        try {
          const feedbackRes = await pollsAPI.getFeedback(id);
          if (feedbackRes?.success) {
            setFeedbackList(feedbackRes.data.feedback || []);
          }
        } catch (e) {
          // non-fatal if reload fails
        }
      }
    } catch (err: any) {
      console.error("Submit feedback error:", err);
      showAlert(err?.message || "Failed to submit feedback", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl p-6 shadow relative">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 mb-4"
        >
          &larr; Back
        </button>

      
        <button
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-600 hover:bg-gray-100 rounded-full p-2"
           style={{ fontSize: "28px", lineHeight: "20px" }}
        >
          &times;
        </button>

        <div className="md:flex md:gap-6">
          {/* Left: image + heading + selected option */}
          <div className="md:w-1/2 flex flex-col items-center justify-center mb-6 md:mb-0 text-center px-4">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Poll Feedback</h1>
            <p className="text-sm text-gray-600 mb-2">Help improve polls by sharing why you chose that option.</p>
            {/* Poll title/name under subtitle */}
            {poll && (
              <h2 className="text-lg font-medium text-gray-800 mb-3">{poll.question}</h2>
            )}
            <div className="mb-4">
              <div className="inline-block bg-[#EFEBE9] text-[#4E342E] px-3 py-1 rounded-lg font-medium">{selectedOptionText}</div>
            </div>
            <img src={pollsFeedbackImg} alt="Poll feedback" className="w-full h-auto rounded" />
          </div>

          {/* Right: form + feedback list */}
          <div className="md:w-1/2">
            {loading ? (
              <p className="text-gray-500">Loading poll...</p>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Choice <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why did you pick this option?"
                  className="w-full border rounded-lg p-3 mb-3"
                  disabled={submitting}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">Improvements Needed (optional)</label>
                <textarea
                  rows={3}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Any suggestions to improve the poll or option?"
                  className="w-full border rounded-lg p-3 mb-3"
                  disabled={submitting}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">Concerns / Suggestions (optional)</label>
                <textarea
                  rows={3}
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  placeholder="Any other concerns or suggestions?"
                  className="w-full border rounded-lg p-3 mb-3"
                  disabled={submitting}
                />

                <label className="block text-sm font-medium text-gray-700 mb-2">Rating <span className="text-red-600">*</span></label>
                <div className="mb-4">
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="px-3 py-2 border rounded-lg"
                    disabled={submitting}
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Okay</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Very poor</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 border rounded"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-[#4E342E] text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
                {/* Existing feedback list (visible only to allowed users, enforced by backend) */}
                <div className="mt-8 border-t pt-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Other Voters&apos; Feedback
                  </h2>
                  {loadingFeedback ? (
                    <p className="text-gray-500 text-sm">Loading feedback...</p>
                  ) : feedbackList.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No feedback submitted yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {feedbackList.map((fb, index) => {
                        const createdAt = fb.createdAt
                          ? new Date(fb.createdAt).toLocaleString()
                          : "";
                        return (
                          <div
                            key={fb._id || index}
                            className="border border-gray-200 rounded-lg p-3 text-sm bg-gray-50"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-gray-800">
                                {fb.user?.name || "Voter"}
                              </span>
                              <span className="text-xs text-gray-500">
                                Rating: {fb.rating}/5
                              </span>
                            </div>
                            {fb.selectedOptionText && (
                              <p className="text-xs text-gray-600 mb-1">
                                Choice:{" "}
                                <span className="font-medium">
                                  {fb.selectedOptionText}
                                </span>
                              </p>
                            )}
                            <p className="text-gray-800 mb-1">
                              {fb.reason}
                            </p>
                            {fb.improvements && (
                              <p className="text-gray-600">
                                <span className="font-semibold">
                                  Improvements:
                                </span>{" "}
                                {fb.improvements}
                              </p>
                            )}
                            {fb.concerns && (
                              <p className="text-gray-600">
                                <span className="font-semibold">Concerns:</span>{" "}
                                {fb.concerns}
                              </p>
                            )}
                            {createdAt && (
                              <p className="text-[11px] text-gray-400 mt-1">
                                {createdAt}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
