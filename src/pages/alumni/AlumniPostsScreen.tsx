"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  SparklesIcon,
  BriefcaseIcon,
  HeartIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import PostCard, { PostCardData } from "../../components/PostCard";
import { studentApi } from "../../lib/api";

export default function AlumniPostsScreen() {
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [postsList, setPostsList] = useState<PostCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toastMessage, setToastMessage] = useState("");

  // Post Creation Modal State
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("Job Opportunity");
  const [postLocation, setPostLocation] = useState("");
  const [postContent, setPostContent] = useState("");



  // Load real posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await studentApi.getPosts();
        if (res.success && Array.isArray(res.data)) {
          const formatted: PostCardData[] = res.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            category: item.category || "Community",
            authorName: item.author_name || "Alumni",
            authorEmail: item.author_email,
            isMyPost: item.author_email === "alumni@maatram.com",
            createdAt: item.created_at,
            scheduleDate: item.schedule_date,
            scheduleTime: item.schedule_time,
            location: item.location,
            imageUrl: item.image_url,
            images: item.images,
            likesCount: 15,
          }));
          setPostsList(formatted);
        } else {
          setPostsList([]);
        }
      } catch (err) {
        console.error("Failed to load posts from API:", err);
        setPostsList([]);
      }
    };

    fetchPosts();
  }, []);

  const savePosts = (updated: PostCardData[]) => {
    setPostsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("maatram_alumni_posts", JSON.stringify(updated));
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    let authorName = "Sundararaman M (Zoho)";
    let authorEmail = "alumni@maatram.com";
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("maatram_student_user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.name) authorName = `${u.name} (Alumni)`;
          if (u.email) authorEmail = u.email;
        } catch {
          // ignore
        }
      }
    }

    const newPost: PostCardData = {
      id: `alu-p-${Date.now()}`,
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      authorName,
      authorEmail,
      isMyPost: true,
      location: postLocation.trim() || undefined,
      createdAt: new Date().toISOString(),
      likesCount: 1,
    };

    const updated = [newPost, ...postsList];
    savePosts(updated);

    // Reset Form
    setPostTitle("");
    setPostLocation("");
    setPostContent("");
    setIsNewPostModalOpen(false);

    setToastMessage("Your alumni post has been published and added to All Posts & My Posts!");
    setTimeout(() => setToastMessage(""), 4500);
  };

  const [selectedPost, setSelectedPost] = useState<PostCardData | null>(null);

  const handleDeletePost = (post: PostCardData) => {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      const updated = postsList.filter((p) => p.id !== post.id);
      savePosts(updated);
      if (selectedPost?.id === post.id) setSelectedPost(null);
      setToastMessage("Post deleted successfully.");
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  // Segregation counts
  const allPostsCount = postsList.length;
  const myPostsCount = postsList.filter((p) => p.isMyPost).length;

  // Filtered Posts based on Tab ("all" vs "my") + Search + Category
  const filteredPosts = useMemo(() => {
    return postsList.filter((post) => {
      // 1. Tab segregation:
      // "all" = Common: all posts show in that
      // "my"  = My Posts: only posts authored by the user
      if (activeTab === "my" && !post.isMyPost) {
        return false;
      }

      // 2. Search filter
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.authorName && post.authorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.location && post.location.toLowerCase().includes(searchTerm.toLowerCase()));

      // 3. Category filter
      const matchesCategory =
        selectedCategory === "All" ||
        post.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [postsList, activeTab, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Dedicated Student / Alumni Sidebar */}
      <StudentSidebar activeTab="posts" sectionRole="alumni" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <main className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Alumni Community & Job Referrals
              </h1>
              <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                Share corporate openings, employee referrals, mentorship sessions, and inspiring journeys.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewPostModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.2]" />
              <span>Share Alumni Post</span>
            </button>
          </div>

          {/* Success Toast */}
          {toastMessage && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircleIcon className="w-4 h-4 text-amber-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Segregation Tabs: All Posts (Common) vs My Posts */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === "all"
                  ? "bg-[#F7BC0F] text-slate-950 shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>All Posts (Common)</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === "all" ? "bg-black/10 text-slate-950" : "bg-slate-100 text-slate-600"
                  }`}
              >
                {allPostsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === "my"
                  ? "bg-[#F7BC0F] text-slate-950 shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>My Posts</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === "my" ? "bg-black/10 text-slate-950" : "bg-slate-100 text-slate-600"
                  }`}
              >
                {myPostsCount}
              </span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === "my"
                    ? "Search your published posts..."
                    : "Search all posts by topic, company, role, or author..."
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/20 transition"
              />
            </div>
          </section>

          {/* Posts Feed / Empty States */}
          {filteredPosts.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 space-y-3 max-w-3xl">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-heading font-bold text-base text-slate-800">
                {activeTab === "my" ? "No Posts in My Posts" : "No Posts Found"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {activeTab === "my"
                  ? "You haven't published any posts yet. Share a job referral, opening at your company, or mentor reflection!"
                  : "No posts match your search or category filter. Try clearing your search."}
              </p>
              {activeTab === "my" && (
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Browse All Posts
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewPostModalOpen(true)}
                    className="px-4 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Create Post
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReadMore={(p) => setSelectedPost(p)}
                  onDelete={post.isMyPost ? handleDeletePost : undefined}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL VIEW MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {selectedPost.category || "Post"}
                </span>
                {selectedPost.location && (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{selectedPost.location}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedPost.imageUrl && (
              <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h2 className="font-heading font-bold text-xl text-slate-900 leading-snug">
              {selectedPost.title}
            </h2>

            <div className="text-xs text-slate-500 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span>By {selectedPost.authorName || "Alumni"}</span>
              <span>•</span>
              <span>{selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString() : ""}</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-primary whitespace-pre-wrap">
              {selectedPost.content}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 text-xs font-heading font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Alumni Post Modal */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Share Alumni Post / Job Referral
                </h3>
                <p className="text-xs text-slate-500">
                  Post hiring alerts, corporate referrals, tech insights, or mentorship guidance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Post Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Zoho Corporation Hiring 6 Frontend Developers (0-2 Yrs)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F7BC0F] focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F7BC0F] focus:bg-white text-slate-900"
                  >
                    <option value="Job Opportunity">Job Opportunity</option>
                    <option value="Alumni Story">Alumni Story</option>
                    <option value="Mentorship Offer">Mentorship Offer</option>
                    <option value="Tech Insights">Tech Insights</option>
                    <option value="Community">Community Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location / Work Mode</label>
                  <input
                    type="text"
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    placeholder="e.g. Chennai / Hybrid"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F7BC0F] focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Content / Message Details *</label>
                <textarea
                  required
                  rows={5}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Describe the role requirements, team details, how scholars can apply, or share your inspiring journey..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F7BC0F] focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
