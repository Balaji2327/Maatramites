"use client";

import React from "react";
import Image from "next/image";
import {
  CalendarIcon,
  UserCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  MapPinIcon,
  VideoCameraIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

export interface PostCardData {
  id: string;
  title: string;
  content: string;
  category?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  location?: string;
  videoUrl?: string;
  videoFileName?: string;
  images?: string[];
  language?: string;
  authorName?: string;
  authorEmail?: string;
  isMyPost?: boolean;
  createdAt: string;
  imageUrl?: string;
  likesCount?: number;
}

interface PostCardProps {
  post: PostCardData;
  onReadMore?: (post: PostCardData) => void;
  onEdit?: (post: PostCardData) => void;
  onDelete?: (post: PostCardData) => void;
}

export default function PostCard({
  post,
  onReadMore,
  onEdit,
  onDelete,
}: PostCardProps) {
  return (
    <div className="group bg-white rounded-xl border border-black/15 hover:shadow-sm hover:border-brand/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div onClick={() => onReadMore?.(post)} className="cursor-pointer">
        {/* Optional Post Image Header */}
        {post.imageUrl ? (
          <div className="relative w-full h-48 bg-black/5 overflow-hidden shrink-0">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {post.category && (
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/95 text-black border border-black/15">
                  {post.category}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 pb-0 flex items-center justify-between">
            {post.category ? (
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand/15 text-black border border-brand/60">
                {post.category}
              </span>
            ) : (
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/5 text-black">
                Announcement
              </span>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.language && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/5 text-black flex items-center gap-1">
                <GlobeAltIcon className="w-3 h-3 text-black/65 shrink-0" />
                <span>{post.language}</span>
              </span>
            )}
            {post.scheduleDate && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand/15 text-black flex items-center gap-1">
                <CalendarDaysIcon className="w-3 h-3 text-black/65 shrink-0" />
                <span>{post.scheduleDate} {post.scheduleTime ? `@ ${post.scheduleTime}` : ""}</span>
              </span>
            )}
            {post.location && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand/15 text-black truncate max-w-[140px] flex items-center gap-1">
                <MapPinIcon className="w-3 h-3 text-black/65 shrink-0" />
                <span className="truncate">{post.location}</span>
              </span>
            )}
            {post.videoUrl && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand/15 text-black flex items-center gap-1">
                <VideoCameraIcon className="w-3 h-3 text-black/65 shrink-0" />
                <span>Video</span>
              </span>
            )}
            {post.images && post.images.length > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand/15 text-black flex items-center gap-1">
                <PhotoIcon className="w-3 h-3 text-black shrink-0" />
                <span>{post.images.length} Photos</span>
              </span>
            )}
          </div>

          <h3
            className="font-heading font-bold text-base text-black group-hover:text-black transition-colors line-clamp-2 leading-snug"
            title={post.title}
          >
            {post.title}
          </h3>

          <p className="text-xs text-black line-clamp-3 leading-relaxed">
            {post.content}
          </p>
        </div>
      </div>

      {/* Footer Info & Admin Actions (Edit & Delete) */}
      <div className="px-5 pb-4 pt-3 border-t border-black/15 flex items-center justify-between gap-2 text-[11px] text-black/65 font-medium">
        <div className="flex items-center gap-1.5 text-black truncate min-w-0">
          <UserCircleIcon className="w-4 h-4 text-black/65 shrink-0" />
          <span className="truncate">{post.authorName || "Foundation Admin"}</span>
          <span className="text-black/65">•</span>
          <span className="shrink-0 text-black/65">
            {post.createdAt ? (post.createdAt.length > 10 && post.createdAt.includes("-") ? post.createdAt.substring(0, 10) : post.createdAt) : "Recent"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
              }}
              className="p-1.5 rounded-lg text-black/65 hover:text-black hover:bg-brand/15 transition cursor-pointer"
              title="Edit Post"
            >
              <PencilSquareIcon className="w-4 h-4 stroke-[2]" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(post);
              }}
              className="p-1.5 rounded-lg text-black/65 hover:text-black hover:bg-brand/15 transition cursor-pointer"
              title="Delete Post"
            >
              <TrashIcon className="w-4 h-4 stroke-[2]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
