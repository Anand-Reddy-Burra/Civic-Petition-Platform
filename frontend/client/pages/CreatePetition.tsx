
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { petitionsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";

export default function CreatePetition() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSuccess(null);

    // Validation
    if (!title.trim()) {
      setError("Petition title is required.");
      return;
    }
    if (!category) {
      setError("Category is required.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!goal || isNaN(parseInt(goal)) || parseInt(goal) < 1) {
      setError("Signature goal must be a positive number.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!closesOn.trim()) {
      setError("Closing date is required.");
      return;
    }

    // Check if user is authenticated
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setError("Please sign in to create a petition.");
      showAlert("Please sign in to create a petition.", "error");
      navigate("/signin");
      return;
    }

    const parsedDate = closesOn; 

    // Validate date
    const testDate = new Date(parsedDate);
    if (isNaN(testDate.getTime())) {
      setError("Invalid date format.");
      return;
    }

    // Check if date is in future
    if (testDate <= new Date()) {
      setError("Closing date must be in the future.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      goal: parseInt(goal),
      closesOn: parsedDate,
    };

    try {
      setLoading(true);
      const response = await petitionsAPI.create(payload);

      if (response.success) {
        setSuccess("Petition submitted for review!");
        showAlert("Petition created successfully and submitted for review!", "success");
        // Reset form
        setTitle("");
        setCategory("");
        setLocation("");
        setGoal("");
        setDescription("");
        setClosesOn("");
        // Navigate to petitions page (My Petitions tab) after a short delay
        setTimeout(() => {
          navigate("/petitions/community?tab=mine");
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Server error.";
      setError(errorMessage);
      showAlert(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Create a New Petition
        </h1>
        <p className="text-gray-600 mb-6">
          Start a petition to bring attention to important issues in your
          community. Your petition will be reviewed before going live.
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

        {/* Petition Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Petition Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Petition Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="What change do you want to see?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Be clear and concise. This is what people will see first.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] bg-white"
            >
              <option value="">Select a category</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="environment">Environment</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="safety">Safety</option>
              <option value="transportation">Transportation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="City, State or Neighborhood"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Where will this petition have an impact?
            </p>
          </div>

          {/* Signature Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Signature Goal <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 1000"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set a realistic goal for the number of signatures you want to
              collect.
            </p>
          </div>

          {/* Closing Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Closes On <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={closesOn}
              onChange={(e) => setClosesOn(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose the last date for collecting signatures.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              placeholder="Explain why this petition is important and what you hope to achieve..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide context, explain the problem, and describe your proposed
              solution. The more detailed and compelling, the better.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#4E342E] text-white py-3 rounded-md font-medium hover:bg-[#4E342E] transition-colors disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Petition for Review"}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
