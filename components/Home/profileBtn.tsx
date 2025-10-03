"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";

export default function ProfileBtn(): React.ReactElement {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // compute initials when image not present
  const initials = (() => {
    const name = user?.name?.trim();
    if (name && name.length > 0) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  })();

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!menuRef.current || !btnRef.current) return;
      if (menuRef.current.contains(target) || btnRef.current.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("click", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("click", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // If auth status still loading, show nothing or a skeleton
  if (status === "loading") {
    return <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />;
  }

  // If not logged-in, render a simple Sign In button
  if (!user) {
    return (
      <div>
        <button
          onClick={() => signIn()}
          className="px-3 py-1 rounded-md bg-gray-700 text-white text-sm hover:bg-gray-800"
        >
          Sign in
        </button>
      </div>
    );
  }

  // Logged-in view
  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="profile-menu"
        className="flex items-center gap-2 focus:outline-none"
        title={user.name ?? user.email ?? ""}
        type="button"
      >
        {user.image ? (
          <Image
            src={user.image ?? "/public/img/user (1).png"}
            alt={user.name ?? "avatar"}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-medium">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div
          id="profile-menu"
          ref={menuRef}
          role="menu"
          aria-labelledby="profile-button"
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        >
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user.name ?? "No name"}
            </div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
            {/*
              show role if present (admin/user)
            */}
            {user.role && (
              <div className="mt-1 text-xs uppercase text-blue-600 font-semibold">
                {String(user.role)}
              </div>
            )}
          </div>

          <div className="py-1">
            {user?.role === "admin" && (
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                role="menuitem"
              >
                Dashboard
              </Link>
            )}

            <Link
              href="/wishlist"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Wishlist
            </Link>

            <Link
              href="/ordersHistory"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Orders
            </Link>
          </div>

          <div className="border-t px-2 py-2">
            <button
              onClick={() =>
                signOut({
                  callbackUrl: "/" /* optional: redirect after signout */,
                })
              }
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded"
              role="menuitem"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
