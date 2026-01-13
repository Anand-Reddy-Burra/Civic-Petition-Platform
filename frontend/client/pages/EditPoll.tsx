import React, { useState, useEffect } from "react";
import { Calendar, Plus, X, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { pollsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";

export default function EditPoll() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      const res = await pollsAPI.getById(id);
      if (res.success) {
        const p = res.data.poll;
        setQuestion(p.question || "");
        setDescription(p.description || "");
        setOptions(
          Array.isArray(p.options)
            ? p.options.map((o) => (typeof o === "string" ? o : o.text || ""))
            : ["", ""]
        );
        setCategory(p.category || "");
        setLocation(p.location || "");
        setClosesOn(p.closesOn ? p.closesOn.split("T")[0] : "");
      }
    } catch (err) {
      console.error("Error fetching poll:", err);
      showAlert("Failed to load poll details", "error");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validate = () => {
    if (!question.trim()) return "Poll question is required.";
    if (options.filter((o) => o.trim()).length < 2)
      return "Provide at least 2 options.";
    if (!category) return "Select a category.";
    if (!location.trim()) return "Location is required.";
    if (!closesOn.trim()) return "Closing date is required.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        question,
        description,
        options: options.filter((o) => o.trim()),
        category,
        location,
        closesOn,
      };
      const res = await pollsAPI.update(id, payload);
      if (res.success) {
        showAlert("Poll updated successfully!", "success");
        setSuccess("Poll updated successfully!");
        setTimeout(() => navigate("/polls/community"), 1500);
      }
    } catch (err) {
      console.error("Error updating poll:", err);
      showAlert("Failed to update poll", "error");
      setError("Failed to update poll. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-500 mt-10">Loading poll details...</p>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Heading */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Edit Poll
        </h1>
        <p className="text-gray-600 mb-8">
          Update your poll details. Changes will reflect immediately for all
          users.
        </p>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
            {success}
          </div>
        )}

        {/* Poll Details */}
        <div className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] outline-none resize-none"
            />
          </div>

          {/* Poll Options */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Poll Options <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Provide at least 2 options for voters to choose from
            </p>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="mt-3 flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <Plus size={16} /> Add Another Option
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] bg-white"
            >
              <option value="">Select a category</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="environment">Environment</option>
              <option value="safety">Safety</option>
              <option value="transportation">Transportation</option>
              <option value="Parks & Recreation">Parks & Recreation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E]"
            />
          </div>

          {/* Closes On */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Closes On <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={closesOn}
              onChange={(e) => setClosesOn(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E]"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[#4E342E] text-white py-3 rounded-md font-medium hover:bg-[#3E2723] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
