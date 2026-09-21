/**
 * Placeholder shared types, loosely matching docs/04-db-diagram.md at the repo root.
 * Illustrative only — will be nailed down once the API is built.
 */

export type UserRole = "member" | "reviewer" | "admin";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  bio: string | null;
}

export type ProductStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "rejected"
  | "approved"
  | "scheduled"
  | "launched"
  | "taken_down";

/**
 * Shape used by the static products list/detail pages today (see
 * src/lib/products.ts). Founder, status, and moderation fields aren't
 * included yet — add them once submission/review flows are built.
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string | null;
  topics: string[];
  websiteUrl: string;
  votesCount: number;
  launchDate: string | null;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
}

export interface Comment {
  id: number;
  productId: number;
  userId: number;
  parentCommentId: number | null;
  body: string;
  createdAt: string;
}
