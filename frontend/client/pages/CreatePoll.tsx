import React, { useState } from "react";
import { Calendar, Plus, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pollsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";

export default function PollForm() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index: number, value: string) => {
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

    // Validate date format (accepts dd-mm-yyyy or yyyy-mm-dd)
    const dateRegex = /^(\d{1,2}-\d{1,2}-\d{4}|\d{4}-\d{1,2}-\d{1,2})$/;
    if (!dateRegex.test(closesOn.replace(/\//g, '-'))) {
      return "Please enter a valid date format (dd-mm-yyyy or yyyy-mm-dd).";
    }

    return null;
  };

  const parseDate = (dateString: string): string => {
    // If it's already in yyyy-mm-dd format (from date input), use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse different date formats
    const normalized = dateString.replace(/\//g, '-');
    const parts = normalized.split('-');

    if (parts.length === 3) {
      // If format is dd-mm-yyyy, convert to yyyy-mm-dd
      if (parts[0].length <= 2 && parts[2].length === 4) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // If format is yyyy-mm-dd, return as is
      if (parts[0].length === 4) {
        return normalized;
      }
    }

    // If we can't parse, try to use as is and let backend validate
    return dateString;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if user is authenticated
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setError("Please sign in to create a poll.");
      navigate("/signin");
      return;
    }

    const parsedDate = parseDate(closesOn);
    
    // Validate the parsed date is actually a valid future date
    const testDate = new Date(parsedDate);
    if (isNaN(testDate.getTime())) {
      setError("Invalid date format. Please use a valid date.");
      return;
    }
    
    // Check if date is in the future (with some buffer for timezone issues)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day
    testDate.setHours(0, 0, 0, 0);
    
    if (testDate <= now) {
      setError("Closing date must be in the future.");
      return;
    }
    
    const payload = {
      question: question.trim(),
      description: description?.trim() || '',
      options: options.filter((o) => o.trim()),
      category,
      location: location.trim(),
      closesOn: parsedDate,
    };

    try {
      setLoading(true);
      const response = await pollsAPI.create(payload);

      if (response.success) {
        setSuccess("Poll submitted for review!");
        showAlert("Poll created successfully and submitted for review!", "success");
        // Reset form
        setQuestion("");
        setDescription("");
        setOptions(["", ""]);
        setCategory("");
        setLocation("");
        setClosesOn("");
        // Navigate to polls page (My Polls tab) after a short delay
        setTimeout(() => {
          navigate("/polls/community?tab=my");
        }, 1500);
      }
    } catch (err: any) {
      let errorMessage = err.message || "Server error.";
      
      // If the error has detailed validation errors, show them
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const validationErrors = err.errors.map((e: any) => 
          `${e.field}: ${e.message}`
        ).join(", ");
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (err.message && err.message.includes("Validation failed")) {
        // Try to extract more details if available
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showAlert(errorMessage, "error");
      console.error("Poll creation error:", err);
    } finally {
      setLoading(false);
    }
  };

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
          Create a New Poll
        </h1>
        <p className="text-gray-600 mb-8">
          Create a poll to gather community opinion on important issues. Your
          poll will be reviewed before going live.
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
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Poll Details
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Fill in the information below to create your poll
        </p>

        <div className="space-y-6">
          {/* Poll Question */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="What would you like to ask the community?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ask a clear, specific question that can be answered with the
              options you provide.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              placeholder="Provide context and background information for your poll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Help voters understand the context and importance of this poll.
            </p>
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
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none bg-white"
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
              placeholder="City, State or Neighborhood"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Where is this poll most relevant?
            </p>
          </div>

          {/* Closes On */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Closes On <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={closesOn}
                onChange={(e) => setClosesOn(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4E342E] focus:border-[#4E342E] outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose the last date
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#4E342E] text-white py-3 rounded-md font-medium hover:bg-[#4E342E] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Poll"}
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