import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Share2,
  User,
  MapPin,
  X,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Edit,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { petitionsAPI } from "@/lib/api";
import { showAlert } from "@/lib/auth";

export default function CommunityPetitions() {
  const navigate = useNavigate();

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
  const initialTab = tabFromUrl === "mine" ? "mine" : (tabFromUrl || (isOfficial ? "pending" : "all"));

  const [petitions, setPetitions] = useState([]);
  const [pendingPetitions, setPendingPetitions] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showShare, setShowShare] = useState(null);
  const [showSignModal, setShowSignModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchPetitions();
        if (isOfficial) {
          await fetchPendingPetitions();
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, filterCategory, filterLocation, filterStatus, isOfficial]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPetitions();
      if (isOfficial) {
        fetchPendingPetitions();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      const params = {
        my: activeTab === "mine" ? "true" : undefined,
        signed: activeTab === "signed" ? "true" : undefined,
        status:
          activeTab === "pending"
            ? "under_review"
            : activeTab !== "pending" && filterStatus !== "all"
            ? filterStatus
            : undefined,
        approved: activeTab !== "pending" ? "true" : undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        location: filterLocation !== "all" ? filterLocation : undefined,
        search: search || undefined,
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);
      const response = await petitionsAPI.getAll(params);
      if (response.success) {
        const fetchedPetitions = response.data.petitions || [];
        // For "My Petitions" tab, show all petitions including rejected
        // For other tabs, filter based on user role
        let filteredPetitions;
        if (activeTab === "mine") {
          // Show all user's petitions regardless of status (including rejected)
          filteredPetitions = fetchedPetitions;
        } else if (isOfficial) {
          filteredPetitions = fetchedPetitions;
        } else {
          filteredPetitions = fetchedPetitions.filter(
            (p) => p.status !== "rejected" && p.isActive
          );
        }
        setPetitions(filteredPetitions);
        const activePetitions = filteredPetitions.filter(
          (p) => p.status === "active" || p.status === "under_review" || p.status === "closed"
        );
        const categories = Array.from(
          new Set(activePetitions.map((p) => p.category).filter(Boolean))
        );
        const locations = Array.from(
          new Set(activePetitions.map((p) => p.location).filter(Boolean))
        );
        setUniqueCategories(["all", ...categories]);
        setUniqueLocations(["all", ...locations]);
      }
    } catch (error) {
      console.error("Error fetching petitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPetitions = async () => {
    try {
      const params = {
        status: "under_review",
        approved: "false",
        category: filterCategory !== "all" ? filterCategory : undefined,
        location: filterLocation !== "all" ? filterLocation : undefined,
        search: search || undefined,
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);
      const response = await petitionsAPI.getAll(params);
      if (response.success) {
        const pendingOnly = response.data.petitions.filter(
          (p) => p.status === "under_review" && !p.isApproved
        );
        setPendingPetitions(pendingOnly);
      }
    } catch (error) {
      console.error("Error fetching pending:", error);
    }
  };

  const petitionsToShow = activeTab === "pending" ? pendingPetitions : petitions;

  const filtered = useMemo(() => {
    return petitionsToShow.filter((p) => {
      const q = search.trim().toLowerCase();
      return (
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.tags?.join(" ").toLowerCase().includes(q))
      );
    });
  }, [petitionsToShow, search]);

  const percent = (signatures, goal) => {
    if (!goal) return 0;
    return Math.min(100, Math.round((signatures / goal) * 100));
  };

  const getDaysRemaining = (closesOn) => {
    if (!closesOn) return 0;
    const now = new Date();
    const end = new Date(closesOn);
    if (isNaN(end.getTime())) return 0;
    return Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-700 border-green-300",
      under_review: "bg-yellow-100 text-yellow-700 border-yellow-300",
      closed: "bg-gray-100 text-gray-700 border-gray-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${statusConfig[status]}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const hasUserSigned = (petition) => {
    if (!currentUserId || !petition.signedBy) return false;
    return petition.signedBy.some(
      (id) => id.toString() === currentUserId.toString()
    );
  };

  function openShare(petition) {
    setShowShare(petition);
  }
  function shareToSocial(platform, p) {
    const text = encodeURIComponent(p.title);
    const url = encodeURIComponent(window.location.href);
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  }

  async function signPetition(id) {
    if (!currentUser) {
      showAlert("Please sign in first", "error");
      navigate("/signin");
      return;
    }
    try {
      setSigning(true);
      await petitionsAPI.sign(id);
      await fetchPetitions();
      setShowSignModal(null);
    } finally {
      setSigning(false);
    }
  }

  async function approvePetition(id) {
    try {
      setApproving(true);
      await petitionsAPI.approve(id);
      await fetchPendingPetitions();
      await fetchPetitions();
    } finally {
      setApproving(false);
    }
  }

  async function rejectPetition(id) {
    try {
      setRejecting(true);
      await petitionsAPI.reject(id, rejectReason);
      await fetchPendingPetitions();
      await fetchPetitions();
      setShowRejectModal(null);
      setRejectReason("");
    } finally {
      setRejecting(false);
    }
  }

  // Delete Petition logic
  async function handleDeletePetition(id) {
    try {
      setDeleting(true);
      await petitionsAPI.delete(id); 
      setPetitions(petitions.filter((p) => p._id !== id));
      setShowDeleteModal(null);
      showAlert("Petition deleted successfully!", "success");
    } catch (err) {
      showAlert("Failed to delete petition.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-[#4E342E]"
        >
          <ArrowLeft size={18} /> Back
        </button>
        {/* Title and actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4E342E]">
              Petitions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isOfficial
                ? "Review and approve petitions submitted by community"
                : "Support causes that matter to you or create your own!"}
            </p>
          </div>
          {!isOfficial && (
            <button
              onClick={() => navigate("/petition/create")}
              className="inline-flex items-center gap-2 bg-[#4E342E] text-white px-5 py-3 rounded-xl shadow hover:bg-[#3E2723]"
            >
              <Plus size={16} /> Start a petition
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Petitions"
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
          {isOfficial ? (
            <>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 rounded-lg text-sm relative ${activeTab === "pending"
                    ? "text-[#4E342E]"
                    : "text-gray-600"
                  }`}
              >
                <AlertCircle size={16} className="inline mr-1" /> Pending Review
                {activeTab === "pending" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4E342E]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-sm relative ${activeTab === "all"
                    ? "text-[#4E342E]"
                    : "text-gray-600"
                  }`}
              >
                All Approved
                {activeTab === "all" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4E342E]" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-sm relative ${activeTab === "all"
                  ? "text-[#4E342E]"
                  : "text-gray-600"
                }`}
              >
                All Petitions
                {activeTab === "all" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4E342E]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={`px-4 py-2 rounded-lg text-sm relative ${activeTab === "mine"
                  ? "text-[#4E342E]"
                  : "text-gray-600"
                }`}
              >
                My Petitions
                {activeTab === "mine" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4E342E]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("signed")}
                className={`px-4 py-2 rounded-lg text-sm relative ${activeTab === "signed"
                  ? "text-[#4E342E]"
                  : "text-gray-600"
                }`}
              >
                Signed by Me
                {activeTab === "signed" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4E342E]" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Petition List */}
        {loading ? (
          <p className="text-gray-500 text-center mt-10">Loading petitions...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            {activeTab === "pending"
              ? "No pending petitions to review."
              : "No petitions found."}
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((p) => {
              const pct = percent(p.signatures || 0, p.goal || 1);
              const signed = hasUserSigned(p);
              const daysRemaining = getDaysRemaining(p.closesOn);
              const isPending = p.status === "under_review" || !p.isApproved;
              const isRejected = p.status === "rejected";
              const isClosed = p.status === "closed";
              const canEditDelete =
                activeTab === "mine" &&
                currentUserId &&
                ((typeof p.createdBy === "object"
                  ? p.createdBy._id
                  : p.createdBy) === currentUserId);

              // Show rejected petitions in "My Petitions" section, but hide them elsewhere for non-officials
              if (!isOfficial && isRejected && activeTab !== "mine") return null;

              return (
                <div
                  key={p._id}
                  className={`relative bg-white rounded-2xl p-4 sm:p-6 shadow-md flex flex-col gap-4 ${isPending
                      ? "border-2 border-yellow-300"
                      : isRejected
                      ? "border-2 border-red-300 opacity-75"
                      : ""}`}
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 flex-wrap">
                        <h2 className="text-lg md:text-xl font-semibold text-[#4E342E]">
                          {p.title}
                        </h2>
                        {getStatusBadge(
                          p.status || (isPending ? "under_review" : "active")
                        )}
                        {p.trending && !isPending && (
                          <span className="ml-2 inline-flex items-center gap-2 bg-[#4E342E] text-white text-xs px-3 py-1 rounded-full">
                            Trending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{p.description}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-4">
                        {p.tags?.map((t, i) => (
                          <span
                            key={i}
                            className="text-xs bg-[#EFEBE9] text-[#4E342E] px-3 py-1 rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                        {daysRemaining > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <User size={14} />
                        <span className="font-medium text-gray-800">
                          {(p.signatures || 0).toLocaleString()} signatures
                        </span>
                      </div>
                      <div className="mt-auto text-xs text-gray-400">
                        <span>Goal: {p.goal?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {!isPending && !isRejected && (
                    <div>
                      <div className="w-full flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span className="font-medium text-[#4E342E]">Progress</span>
                        <div className="text-sm text-gray-500">{pct}%</div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-[#4E342E] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {isOfficial && isPending ? (
                      <>
                        <button
                          onClick={() => approvePetition(p._id)}
                          disabled={approving}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} />
                          {approving ? "Approving..." : "Approve Petition"}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(p)}
                          disabled={rejecting}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          {rejecting ? "Rejecting..." : "Reject Petition"}
                        </button>
                        <button
                          onClick={() => openShare(p)}
                          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm flex items-center gap-2 hover:bg-gray-200"
                        >
                          <Share2 size={16} />
                          Share
                        </button>
                      </>
                    ) : (
                      <>
                        {!isPending && !isRejected && (
                          <button
                            onClick={() => setShowSignModal(p)}
                            disabled={signed || isClosed || signing}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${signed || isClosed
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-[#4E342E] text-white hover:bg-[#3E2723]"
                            }`}
                          >
                            {signed ? (
                              <span className="inline-flex items-center gap-2">
                                <Check size={14} /> Signed
                              </span>
                            ) : isClosed ? (
                              "Closed"
                            ) : (
                              "Sign Petition"
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openShare(p)}
                          className="px-3 py-1.5 border border-[#4E342E] text-[#4E342E] rounded-md flex items-center gap-2 hover:bg-[#4E342E] hover:text-white transition"
                        >
                          <Share2 size={16} />
                          Share
                        </button>
                      </>
                    )}
                  </div>

                  {/* Edit/Delete buttons (My Petitions only) */}
                  {canEditDelete && (
                    <div className="absolute right-4 bottom-4 flex items-center gap-2 z-10">
                      <button
                        onClick={() => navigate(`/petition/edit/${p._id}`)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-200 shadow-sm flex items-center gap-1"
                      >
                        <Edit size={18} /> Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(p)}
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

      {/* SIGN MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            onClick={() => setShowSignModal(null)}
          />
          <div className="relative bg-white rounded-xl w-[90%] max-w-md p-6">
            <button
              onClick={() => setShowSignModal(null)}
              className="absolute right-4 top-4 text-gray-500"
            >
              <X />
            </button>
            <h3 className="text-lg font-semibold mb-2">Sign Petition</h3>
            <p className="text-gray-600 mb-4">{showSignModal.title}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSignModal(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => signPetition(showSignModal._id)}
                disabled={signing}
                className="px-4 py-2 bg-[#4E342E] text-white rounded-lg disabled:opacity-50"
              >
                {signing ? "Signing..." : "Confirm & Sign"}
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
            <h3 className="text-lg font-semibold mb-2">Reject Petition</h3>
            <p className="text-gray-600 mb-4">{showRejectModal.title}</p>
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
                onClick={() => rejectPetition(showRejectModal._id)}
                disabled={rejecting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {rejecting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
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
            <h2 className="text-lg font-semibold mb-4">Delete Petition</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this petition? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePetition(showDeleteModal._id)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            onClick={() => setShowShare(null)}
          />
          <div className="relative bg-white rounded-xl p-6 w-[90%] max-w-md text-center">
            <button
              onClick={() => setShowShare(null)}
              className="absolute right-4 top-4 text-gray-500"
            >
              <X />
            </button>
            <h2 className="text-lg font-semibold mb-4">Share this Petition</h2>
            <p className="text-gray-600 mb-6">{showShare.title}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => shareToSocial("whatsapp", showShare)}
                className="bg-green-500 text-white p-3 rounded-full"
              >
                <MessageCircle size={20} />
              </button>
              <button
                onClick={() => shareToSocial("twitter", showShare)}
                className="bg-blue-400 text-white p-3 rounded-full"
              >
                <Twitter size={20} />
              </button>
              <button
                onClick={() => shareToSocial("facebook", showShare)}
                className="bg-blue-600 text-white p-3 rounded-full"
              >
                <Facebook size={20} />
              </button>
              <button
                onClick={() => shareToSocial("linkedin", showShare)}
                className="bg-blue-700 text-white p-3 rounded-full"
              >
                <Linkedin size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
