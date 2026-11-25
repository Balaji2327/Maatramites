"use client";

import React from "react";
import { ArrowLeftOnRectangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  userName?: string;
  roleName?: string;
}

export default function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Sign Out Confirmation",
  description = "Are you sure you want to sign out of the Maatram Portal?",
}: SignOutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="bg-white rounded-xl border border-black/15 shadow-sm p-6 sm:p-7 max-w-sm sm:max-w-md w-full relative z-10 animate-in zoom-in-95 duration-150 text-center">
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-black/65 hover:text-black rounded-full hover:bg-black/5 transition cursor-pointer"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 bg-brand/15 border border-brand/60 rounded-lg flex items-center justify-center mx-auto text-black mb-4">
          <ArrowLeftOnRectangleIcon className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Title & Description */}
        <h3 className="font-heading font-bold text-xl sm:text-2xl text-black tracking-tight">
          {title}
        </h3>
        <p className="font-primary text-xs sm:text-sm text-black mt-2 leading-relaxed">
          {description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-md text-xs sm:text-sm font-heading font-bold text-black bg-black/5 hover:bg-black/10 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-md text-xs sm:text-sm font-heading font-bold text-white bg-black hover:bg-black transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
