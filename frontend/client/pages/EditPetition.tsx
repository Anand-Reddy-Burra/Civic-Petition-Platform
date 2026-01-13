import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { petitionsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

export default function EditPetition() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch petition data
  useEffect(() => {
    if (id) {
      fetchPetition();
    }
  }, [id]);

  const fetchPetition = async () => {
    try {
      setFetching(true);
      const response = await petitionsAPI.getById(id!);
      
      if (response.success && response.data.petition) {
        const petition = response.data.petition;
        setTitle(petition.title || "");
        setCategory(petition.category || "");
        setLocation(petition.location || "");
        setGoal(petition.goal?.toString() || "");
        setDescription(petition.description || "");
        
        // Format date for input
        if (petition.closesOn) {
          const date = new Date(petition.closesOn);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          setClosesOn(`${year}-${month}-${day}`);
        }
      }
    } catch (error: any) {
      console.error("Error fetching petition:", error);
      showAlert("Failed to load petition. Please try again.", "error");
      navigate("/petitions/community");
    } finally {
      setFetching(false);
    }
  };

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
      setError("Please sign in to edit a petition.");
      showAlert("Please sign in to edit a petition.", "error");
      navigate("/signin");
      return;
    }

    // Parse date
    const parseDate = (dateString: string): string => {
      const normalized = dateString.replace(/\//g, '-').trim();
      const parts = normalized.split('-');
      
      if (parts.length === 3) {
        if (parts[0].length <= 2 && parts[2].length === 4) {
          // Format: dd-mm-yyyy
          const [day, month, year] = parts;
          const parsed = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          const testDate = new Date(parsed);
          if (!isNaN(testDate.getTime())) {
            return parsed;
          }
        }
        if (parts[0].length === 4) {
          // Format: yyyy-mm-dd
          const parsed = normalized;
          const testDate = new Date(parsed);
          if (!isNaN(testDate.getTime())) {
            return parsed;
          }
        }
      }
      
      return dateString;
    };

    const parsedDate = parseDate(closesOn);
    
    // Validate the date before sending
    const testDate = new Date(parsedDate);
    if (isNaN(testDate.getTime())) {
      setError("Invalid date format. Please use dd-mm-yyyy or yyyy-mm-dd format.");
      return;
    }
    
    // Check if date is in the future
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
      const response = await petitionsAPI.update(id!, payload);

      if (response.success) {
        setSuccess("Petition updated successfully!");
        showAlert("Petition updated successfully! It will need re-approval.", "success");
        // Navigate to petitions page after a short delay
        setTimeout(() => {
          navigate("/petitions/community");
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
        <p className="text-gray-500">Loading petition...</p>
      </div>
    );
  }

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
          Edit Petition
        </h1>
        <p className="text-gray-600 mb-6">
          Update your petition details. Note: After editing, your petition will need to be reviewed again.
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select a future date for the petition to close
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
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
              {loading ? "Updating..." : "Update Petition"}
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

