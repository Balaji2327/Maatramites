"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  SparklesIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import StudentSidebar from "../../components/StudentSidebar";
import PostCard, { PostCardData } from "../../components/PostCard";
import { postMediaUrl, studentApi } from "../../lib/api";

export default function StudentPostsScreen() {
  const [postsList, setPostsList] = useState<PostCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState<PostCardData | null>(null);

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
            authorName: item.author_name || "Maatram Foundation",
            authorEmail: item.author_email,
            isMyPost: false,
            createdAt: item.created_at,
            scheduleDate: item.schedule_date,
            scheduleTime: item.schedule_time,
            location: item.location,
            imageUrl: postMediaUrl(item.image_url || ""),
            videoUrl: postMediaUrl(item.video_url || ""),
            images: (item.images || []).map((url: string) => postMediaUrl(url)),
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

  const filteredPosts = useMemo(() => {
    return postsList.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.authorName && post.authorName.toLowerCase().includes(searchTerm.toLowerCase()));

      // 3. Category
      const matchesCategory =
        selectedCategory === "All" || post.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [postsList, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Dedicated Student Sidebar */}
      <StudentSidebar activeTab="posts" sectionRole="student" />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Community Posts & Announcements
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Read official updates, announcements, volunteer experiences, and foundation news.
              </p>
            </div>
          </div>

          {/* Search & Categories Filter */}
          <section className="bg-white border border-black/15 rounded-lg p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-black/65" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search official announcements, experiences, or achievements..."
                className="w-full bg-black/5 border border-black/15 rounded-md pl-10 pr-4 py-2.5 text-xs text-black placeholder-black/65 focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>
          </section>

          {/* Posts Feed / Empty States */}
          {filteredPosts.length === 0 ? (
            <div className="py-20 text-center bg-white border border-black/15 rounded-xl p-8 space-y-3 max-w-3xl mx-auto">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-black/65 mx-auto" />
              <h3 className="font-heading font-bold text-base text-black">
                No Posts Found
              </h3>
              <p className="text-xs text-black/65 max-w-md mx-auto">
                No posts match your search or selected filter. Try clearing your search keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReadMore={(p) => setSelectedPost(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL VIEW MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-bold text-black bg-brand/15 px-2.5 py-1 rounded-md border border-brand/60">
                  {selectedPost.category || "Post"}
                </span>
                {selectedPost.location && (
                  <span className="text-xs font-semibold text-black bg-black/5 px-2.5 py-1 rounded-md border border-black/15 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                    <span>{selectedPost.location}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-black/65 hover:text-black font-bold text-base p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
              </button>
            </div>

            {(selectedPost.images?.length ? selectedPost.images : selectedPost.imageUrl ? [selectedPost.imageUrl] : []).map((url, i) => (
              <img key={url + i} src={url} alt={`${selectedPost.title}, image ${i + 1}`} className="w-full max-h-96 object-contain rounded-lg" />
            ))}
            {selectedPost.videoUrl && (
              <video controls playsInline preload="metadata" src={selectedPost.videoUrl} className="w-full rounded-lg" />
            )}

            <h2 className="font-heading font-bold text-xl text-black leading-snug">
              {selectedPost.title}
            </h2>

            <div className="text-xs text-black/65 pb-2 border-b border-black/15 flex items-center gap-2">
              <span>By {selectedPost.authorName || "Scholar"}</span>
              <span>•</span>
              <span>{selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString() : ""}</span>
            </div>

            <p className="text-xs text-black leading-relaxed font-primary whitespace-pre-wrap">
              {selectedPost.content}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/15">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
