"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function CommentsSection({
  initialComments,
  slug,
  apiBase,
  accessToken,
}: {
  initialComments: Comment[];
  slug: string;
  apiBase: string;
  accessToken: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    if (apiBase && accessToken) {
      const res = await fetch(`${apiBase}/campaigns/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          typeof err.message === "string"
            ? err.message
            : Array.isArray(err.message)
              ? err.message.join(", ")
              : "Could not submit comment.";
        setNotice(msg);
        window.setTimeout(() => setNotice(null), 6000);
        return;
      }
      const row = (await res.json()) as Comment;
      setComments((c) => [row, ...c]);
      setBody("");
      setNotice("Thanks — your comment is queued for moderator review.");
      window.setTimeout(() => setNotice(null), 5000);
      return;
    }

    if (!accessToken) {
      setNotice("Please log in to post a comment.");
      window.setTimeout(() => setNotice(null), 5000);
      return;
    }

    const next: Comment = {
      id: `local-${Date.now()}`,
      author: "You",
      body: body.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setComments((c) => [next, ...c]);
    setBody("");
    setNotice("Thanks — your comment is queued for moderator review.");
    window.setTimeout(() => setNotice(null), 5000);
  }

  const visible = comments.filter((c) => c.status === "visible");
  const pending = comments.filter((c) => c.status === "pending");

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visible.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-amber-900/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <p className="font-medium text-amber-950">{c.author}</p>
            <p className="mt-1 text-amber-950/80">{c.body}</p>
            <p className="mt-2 text-xs text-amber-950/50">{formatDate(c.createdAt)}</p>
          </div>
        ))}
        {pending.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-dashed border-amber-400/60 bg-amber-50/80 px-4 py-3 text-sm"
          >
            <p className="font-medium text-amber-950">{c.author}</p>
            <p className="mt-1 text-amber-950/80">{c.body}</p>
            <p className="mt-2 text-xs font-medium text-amber-800">Awaiting moderator review</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-amber-900/10 bg-[#fffaf3] p-4">
        <p className="text-sm font-medium text-amber-950">Add a supportive note</p>
        <p className="text-xs text-amber-950/65">
          You must be logged in. Comments are moderated.
        </p>
        <label className="block text-xs font-medium text-amber-950/80">
          Comment
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-lg border border-amber-900/15 bg-white px-3 py-2 text-sm text-amber-950 outline-none ring-teal-600/30 focus:ring-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            required
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          Submit for review
        </button>
        {notice ? <p className="text-sm text-teal-800">{notice}</p> : null}
      </form>
    </div>
  );
}
