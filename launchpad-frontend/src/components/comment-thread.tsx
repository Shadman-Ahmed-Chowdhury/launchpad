"use client";

import Link from "next/link";
import { useState } from "react";
import { CommentForm } from "@/components/comment-form";
import { CommentLikeButton } from "@/components/comment-like-button";
import { CommentReportForm } from "@/components/comment-report-form";
import type { Comment } from "@/types";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const RELATIVE_TIME = new Intl.RelativeTimeFormat("en", { style: "short" });

function timeAgo(dateString: string): string {
  const seconds = (Date.now() - new Date(dateString).getTime()) / 1000;

  for (const [unit, secondsInUnit] of UNITS) {
    if (seconds >= secondsInUnit) {
      return RELATIVE_TIME.format(-Math.floor(seconds / secondsInUnit), unit);
    }
  }

  return "just now";
}

function CommentAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-sm text-background">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentBody({ comment }: { comment: Comment }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <Link
          href={`/profile/${comment.author.handle}`}
          className="text-sm font-medium transition-colors hover:text-gold hover:underline"
        >
          {comment.author.name}
        </Link>
        <span
          className="text-xs text-muted"
          title={new Date(comment.createdAt).toLocaleString()}
          suppressHydrationWarning
        >
          {timeAgo(comment.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{comment.body}</p>
    </div>
  );
}

/**
 * Like + Report for every comment and reply, plus an optional "Reply"
 * toggle — omitted on a reply itself, keeping "one level of reply only"
 * honest in the UI (the backend enforces it regardless, see
 * CommentPolicy::reply()).
 */
function CommentActions({
  slug,
  comment,
  replying,
  onToggleReply,
}: {
  slug: string;
  comment: Comment;
  replying?: boolean;
  onToggleReply?: () => void;
}) {
  return (
    <div className="mt-1 flex items-center gap-4">
      <CommentLikeButton
        slug={slug}
        commentId={comment.id}
        likesCount={comment.likesCount}
        likedByViewer={comment.likedByViewer}
      />
      {onToggleReply && (
        <button
          type="button"
          onClick={onToggleReply}
          className="text-xs font-medium text-muted transition-colors hover:text-gold"
        >
          {replying ? "Cancel" : "Reply"}
        </button>
      )}
      <CommentReportForm slug={slug} commentId={comment.id} reportedByViewer={comment.reportedByViewer} />
    </div>
  );
}

export function CommentThread({ slug, comment }: { slug: string; comment: Comment }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex gap-4">
      <CommentAvatar name={comment.author.name} />
      <div className="min-w-0 flex-1">
        <CommentBody comment={comment} />

        <CommentActions
          slug={slug}
          comment={comment}
          replying={replying}
          onToggleReply={() => setReplying((current) => !current)}
        />

        {replying && (
          <div className="mt-3">
            <CommentForm slug={slug} parentCommentId={comment.id} autoFocus placeholder="Write a reply" />
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 border-l border-hairline pl-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <CommentAvatar name={reply.author.name} />
                <div className="min-w-0 flex-1">
                  <CommentBody comment={reply} />
                  <CommentActions slug={slug} comment={reply} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
