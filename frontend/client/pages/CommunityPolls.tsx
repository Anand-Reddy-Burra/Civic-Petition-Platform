import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  MapPin,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  X,
  Share2,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pollsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";

export default function CommunityPolls() {
  const navigate = useNavigate();
  const handleCreatePoll = () => {
    navigate("/polls/create");
  };

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id;
  const isOfficial = currentUser?.role === "official";

  // Get tab from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab");
  const initialTab = tabFromUrl || (isOfficial ? "pending" : "active");

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [showVoteModal, setShowVoteModal] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [polls, setPolls] = useState([]);
  const [pendingPolls, setPendingPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchPolls();
        if (isOfficial) {
          await fetchPendingPolls();
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, filterCategory, filterLocation, isOfficial]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const params = {
        // Don't send active/closed filters for "My Polls" tab - we want all statuses
        active: activeTab === "active" ? "true" : undefined,
        closed: activeTab === "closed" ? "true" : undefined,
        my: activeTab === "my" ? "true" : undefined,
        voted: activeTab === "voted" ? "true" : undefined,
        // Only set status filter for pending tab, not for "my" tab
        status: activeTab === "pending" ? "under_review" : undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        location: filterLocation !== "all" ? filterLocation : undefined,
        search: searchQuery || undefined,
      };

      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await pollsAPI.getAll(params);
      if (response.success) {
        const fetchedPolls = response.data.polls || [];
        // For "My Polls" tab, show all polls including under_review
        // For other tabs, filter based on user role
        let filteredPolls;
        if (activeTab === "my") {
          // Show all user's polls regardless of status (including under_review)
          filteredPolls = fetchedPolls;
        } else if (isOfficial) {
          filteredPolls = fetchedPolls;
        } else {
          filteredPolls = fetchedPolls.filter(
            (p) => p.status !== "rejected" && p.isApproved
          );
        }
        setPolls(filteredPolls);
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
      showAlert(
        error.message || "Failed to fetch polls. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPolls = async () => {
    try {
      const params = {
        status: "under_review",
        category: filterCategory !== "all" ? filterCategory : undefined,
        location: filterLocation !== "all" ? filterLocation : undefined,
        search: searchQuery || undefined,
      };
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );
      const response = await pollsAPI.getAll(params);
      if (response.success) {
        const pendingOnly = response.data.polls.filter(
          (p) => p.status === "under_review" && !p.isApproved
        );
        setPendingPolls(pendingOnly);
      }
    } catch (error) {
      console.error("Error fetching pending polls:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPolls();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const tabs = isOfficial
    ? [
        { id: "pending", label: "Pending Review" },
        { id: "active", label: "Active Polls" },
        { id: "my", label: "My Polls" },
        { id: "closed", label: "Closed Polls" },
      ]
    : [
        { id: "active", label: "Active Polls" },
        { id: "my", label: "My Polls" },
        { id: "voted", label: "Polls I Voted" },
        { id: "closed", label: "Closed Polls" },
      ];

  const getTotalVotes = (poll) => {
    if (poll.totalVotes !== undefined) return poll.totalVotes;
    return (
      poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0
    );
  };

  const calculatePercentage = (votes, totalVotes) =>
    totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (closesOn) => {
    if (!closesOn) return 0;
    const now = new Date();
    const closeDate = new Date(closesOn);
    if (isNaN(closeDate.getTime())) return 0;
    const diff = closeDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const hasUserVoted = (poll) => {
    if (!currentUserId || !poll.votedBy) return false;
    return poll.votedBy.some(
      (id) => id.toString() === currentUserId.toString()
    );
  };
  const isCreator = (poll) =>
    currentUserId &&
    ((typeof poll.createdBy === "object"
      ? poll.createdBy._id
      : poll.createdBy) === currentUserId);

  const handleVote = (pollId) => {
    if (!currentUser) {
      showAlert("Please sign in to vote on polls", "error");
      navigate("/signin");
      return;
    }
    setShowVoteModal(pollId);
    setSelectedOption(null);
  };

  const submitVote = async () => {
    if (selectedOption === null || !showVoteModal) return;

    try {
      setVoting(true);
      const response = await pollsAPI.vote(showVoteModal, selectedOption);

      if (response.success) {
        showAlert("Vote recorded successfully!", "success");
        await fetchPolls();
        const votedPollId = showVoteModal;
        // get the option text so we can show it on the feedback page
        const poll = polls.find((p) => p._id === showVoteModal);
        const option = poll?.options?.find((o) => o._id === selectedOption);
        const selectedText = option?.text || "Your choice";
        setShowVoteModal(null);
        setSelectedOption(null);
        // Open feedback page for the poll (works for both users and officials)
        navigate(`/poll/${votedPollId}/feedback`, { state: { selectedOptionText: selectedText } });
      }
    } catch (error) {
      console.error("Error voting:", error);
      showAlert(
        error.message || "Failed to record vote. Please try again.",
        "error"
      );
    } finally {
      setVoting(false);
    }
  };

  const shareToSocial = (platform, poll) => {
    const text = encodeURIComponent(`Vote on: ${poll.question}`);
    const url = encodeURIComponent(window.location.href);

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  const openResultsModal = (poll) => setShowResultsModal(poll);
  const openShareModal = (poll) => setShowShareModal(poll);
  const closeResultsModal = () => setShowResultsModal(null);
  const closeShareModal = () => setShowShareModal(null);

  const handleDeletePoll = async (id) => {
    try {
      setDeleting(true);
      await pollsAPI.delete(id);
      setPolls(polls.filter((p) => p._id !== id));
      setPendingPolls(pendingPolls.filter((p) => p._id !== id));
      setShowDeleteModal(null);
      showAlert("Poll deleted successfully!", "success");
    } catch (err) {
      showAlert("Failed to delete poll.", "error");
    } finally {
      setDeleting(false);
    }
  };

  async function approvePoll(id) {
    try {
      setApproving(true);
      await pollsAPI.approve(id);
      await fetchPendingPolls();
      await fetchPolls();
      showAlert("Poll approved successfully!", "success");
    } catch (error) {
      showAlert("Failed to approve poll.", "error");
    } finally {
      setApproving(false);
    }
  }

  async function rejectPoll(id) {
    try {
      setRejecting(true);
      await pollsAPI.reject(id, rejectReason);
      await fetchPendingPolls();
      await fetchPolls();
      setShowRejectModal(null);
      setRejectReason("");
      showAlert("Poll rejected successfully!", "success");
    } catch (error) {
      showAlert("Failed to reject poll.", "error");
    } finally {
      setRejecting(false);
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-700 border-green-300",
      under_review: "bg-yellow-100 text-yellow-700 border-yellow-300",
      closed: "bg-gray-100 text-gray-700 border-gray-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${statusConfig[status] || statusConfig.active}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const pollsToShow = activeTab === "pending" ? pendingPolls : polls;

  const filteredPolls = useMemo(() => {
    return pollsToShow.filter((poll) => {
      const matchesSearch = poll.question
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || poll.category === filterCategory;
      const matchesLocation =
        filterLocation === "all" || poll.location === filterLocation;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [pollsToShow, searchQuery, filterCategory, filterLocation]);

  const uniqueCategories = useMemo(() => {
    return [
      "all",
      ...Array.from(new Set(polls.map((p) => p.category || "Uncategorized"))),
    ];
  }, [polls]);

  const uniqueLocations = useMemo(() => {
    return [
      "all",
      ...Array.from(new Set(polls.map((p) => p.location || "Unspecified"))),
    ];
  }, [polls]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-[#4E342E]"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4E342E]">
             Community Polls
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Participate in community decision-making through interactive polls
            </p>
          </div>
          <button
            onClick={handleCreatePoll}
            className="inline-flex items-center gap-2 bg-[#4E342E] text-white px-5 py-3 rounded-xl shadow hover:bg-[#3E2723]"
          >
            <Plus size={16} /> Create Poll
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-100"
            />
          </div>

          <div className="relative w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 pr-10"
            >
              <option value="all">All Categories</option>
              {uniqueCategories
                .filter((c) => c !== "all")
                .map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#432323] pointer-events-none"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div className="relative w-48">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 pr-10"
            >
              <option value="all">All Locations</option>
              {uniqueLocations
                .filter((l) => l !== "all")
                .map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#432323] pointer-events-none"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm relative ${
                activeTab === tab.id
                  ? "text-[#4E342E]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.id === "pending" && <AlertCircle size={16} className="inline mr-1" />}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4E342E]" />
              )}
            </button>
          ))}
        </div>

        {/* Poll List */}
        <p className="text-gray-600 mb-6">
          Vote on active polls to help shape community decisions
        </p>

        {loading ? (
          <p className="text-gray-500 text-center mt-10">Loading polls...</p>
        ) : filteredPolls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            {activeTab === "pending"
              ? "No pending polls to review."
              : "No polls found."}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPolls.map((poll) => {
              const totalVotes = getTotalVotes(poll);
              const progressValue = poll.progress || 0;
              const hasVoted = hasUserVoted(poll);
              const daysRemaining = getDaysRemaining(poll.closesOn);
              const isPending = poll.status === "under_review" || !poll.isApproved;
              const isRejected = poll.status === "rejected";
              const isClosed = poll.status === "closed" || poll.isClosed;

              // Show rejected polls in "My Polls" section, but hide them elsewhere for non-officials
              if (!isOfficial && isRejected && activeTab !== "my") return null;

              return (
                <div
                  key={poll._id}
                  className={`relative bg-white rounded-lg shadow-md border border-gray-200 p-6 ${
                    isPending
                      ? "border-2 border-yellow-300"
                      : isRejected
                      ? "border-2 border-red-300 opacity-75"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3 flex-wrap">
                    <h2 className="text-xl font-semibold text-gray-900 flex-1">
                      {poll.question}
                    </h2>
                    {getStatusBadge(poll.status || (isPending ? "under_review" : "active"))}
                    {poll.trending && !isPending && (
                      <span className="bg-[#4E342E] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                        <TrendingUp size={12} />
                        Trending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
                    <span className="bg-[#EFEBE9] text-[#4E342E] px-2 py-1 rounded-full">
                      {poll.category}
                    </span>
                    <div className="flex items-center bg-[#EFEBE9] text-[#4E342E] px-2 py-1 rounded-full">
                      <MapPin size={15} />
                      {poll.location}
                    </div>
                    <div className="flex items-center bg-[#EFEBE9] text-[#4E342E] px-2 py-1 rounded-full">
                      <Users size={15} />
                      {totalVotes} votes
                    </div>
                    {!poll.isClosed && daysRemaining > 0 && (
                      <>
                        <div className="flex items-center bg-gray-100 text-gray-600 px-2 py-1 rounded-full ">
                          <Clock size={15} />
                          Ends in {daysRemaining} day
                          {daysRemaining !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          <Calendar size={15} />
                          Closes {formatDate(poll.closesOn)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Only show progress bar for approved, active polls */}
                  {!isPending && !isRejected && poll.isApproved && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 text-sm">Progress</span>
                        <span className="text-gray-600 text-sm">
                          {progressValue}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4E342E] h-full rounded-full"
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Show approval/rejection buttons for officials when viewing pending polls (in any tab) */}
                    {isOfficial && isPending && (activeTab === "pending" || activeTab === "my") ? (
                      <>
                        <button
                          onClick={() => approvePoll(poll._id)}
                          disabled={approving}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} />
                          {approving ? "Approving..." : "Approve Poll"}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(poll)}
                          disabled={rejecting}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          {rejecting ? "Rejecting..." : "Reject Poll"}
                        </button>
                        <button
                          onClick={() => openShareModal(poll)}
                          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm flex items-center gap-2 hover:bg-gray-200 whitespace-nowrap"
                        >
                          <Share2 size={16} />
                          Share
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Only show vote button for approved, active polls */}
                        {!isPending && !isRejected && poll.isApproved && (
                          <button
                            onClick={() => handleVote(poll._id)}
                            disabled={hasVoted || isClosed}
                            className={`inline-flex justify-center items-center px-2 py-2 rounded-xl shadow text-sm ${
                              hasVoted || isClosed
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#4E342E] text-white hover:bg-[#3E2723]"
                            } whitespace-nowrap min-w-[90px]`}
                          >
                            {hasVoted
                              ? "Already Voted"
                              : isClosed
                              ? "Closed"
                              : "Vote"}
                          </button>
                        )}

                        {/* Feedback button always visible for officials and poll author */}
                        {(isOfficial || isCreator(poll)) && (
                          <button
                            onClick={() =>
                              navigate(`/poll/${poll._id}/feedback`, {
                                state: { selectedOptionText: "" },
                              })
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 whitespace-nowrap min-w-[90px]"
                          >
                            Feedback
                          </button>
                        )}

                        <button
                          onClick={() => openResultsModal(poll)}
                          className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 whitespace-nowrap min-w-[90px]"
                        >
                          View Results
                        </button>

                        <button
                          onClick={() => openShareModal(poll)}
                          className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 whitespace-nowrap"
                        >
                          <Share2 size={16} />
                          Share
                        </button>
                      </>
                    )}
                  </div>

                  {/* Edit/Delete only in My Polls */}
                  {activeTab === "my" &&
                    currentUserId &&
                    ((typeof poll.createdBy === "object"
                      ? poll.createdBy._id
                      : poll.createdBy) === currentUserId) && (
                      <div className="absolute right-4 bottom-4 flex items-center gap-2 z-10">
                        <button
                          onClick={() => navigate(`/polls/edit/${poll._id}`)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-200 shadow-sm flex items-center gap-1"
                        >
                          <Edit size={18} /> Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(poll)}
                          className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-200 shadow-sm flex items-center gap-1"
                        >
                          <Trash2 size={18} /> Delete
                        </button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-lg relative">
            <button
              onClick={() => setShowVoteModal(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Cast your vote
            </h2>

            {(() => {
              const poll = polls.find((p) => p._id === showVoteModal);
              if (!poll) return null;
              return (
                <>
                  <p className="text-gray-600 mb-4">{poll.question}</p>
                  <div className="mb-4">
                    {poll.options?.map((option) => (
                      <label
                        key={option._id}
                        className="flex items-center gap-3 mb-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="voteOption"
                          value={option._id}
                          checked={selectedOption === option._id}
                          onChange={() => setSelectedOption(option._id)}
                          className="h-4 w-4"
                          disabled={voting}
                        />
                        <span className="text-gray-900">{option.text}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowVoteModal(null)}
                      disabled={voting}
                      className="px-3 py-2 border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitVote}
                      disabled={voting || selectedOption === null}
                      className="bg-[#4E342E] text-white px-3 py-2 rounded-md disabled:opacity-50"
                    >
                      {voting ? "Voting..." : "Confirm Vote"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-lg relative">
            <button
              onClick={closeResultsModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Poll Results
            </h2>
            {showResultsModal.options?.map((option) => {
              const total = getTotalVotes(showResultsModal);
              const percentage = calculatePercentage(option.votes, total);
              return (
                <div key={option._id} className="mb-3">
                  <div className="flex justify-between text-sm font-medium text-gray-900">
                    <span>{option.text}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4E342E] h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-lg relative text-center">
            <button
              onClick={closeShareModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Share this Poll
            </h2>
            <p className="text-gray-600 mb-6">
              Spread the word! Invite others to vote.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => shareToSocial("whatsapp", showShareModal)}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition"
              >
                <MessageCircle size={20} />
              </button>
              <button
                onClick={() => shareToSocial("twitter", showShareModal)}
                className="bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 transition"
              >
                <Twitter size={20} />
              </button>
              <button
                onClick={() => shareToSocial("facebook", showShareModal)}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition"
              >
                <Facebook size={20} />
              </button>
              <button
                onClick={() => shareToSocial("linkedin", showShareModal)}
                className="bg-blue-700 text-white p-3 rounded-full hover:bg-blue-800 transition"
              >
                <Linkedin size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(null);
              setRejectReason("");
            }}
          />
          <div className="relative bg-white rounded-xl w-[90%] max-w-md p-6">
            <button
              onClick={() => {
                setShowRejectModal(null);
                setRejectReason("");
              }}
              className="absolute right-4 top-4 text-gray-500"
            >
              <X />
            </button>
            <h3 className="text-lg font-semibold mb-2">Reject Poll</h3>
            <p className="text-gray-600 mb-4">{showRejectModal.question}</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border rounded-lg p-3 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectPoll(showRejectModal._id)}
                disabled={rejecting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {rejecting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(null)}
          />
          <div className="relative bg-white rounded-xl w-[90%] max-w-md p-6 text-center">
            <button
              onClick={() => setShowDeleteModal(null)}
              className="absolute right-4 top-4 text-gray-500"
            >
              <X />
            </button>
            <h2 className="text-lg font-semibold mb-4">Delete Poll</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this poll? This action cannot be
              undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePoll(showDeleteModal._id)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
