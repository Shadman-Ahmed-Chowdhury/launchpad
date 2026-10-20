/**
 * Placeholder shared types, loosely matching docs/04-db-diagram.md at the repo root.
 * Illustrative only — will be nailed down once the API is built.
 */

export type UserRole = "member" | "reviewer" | "admin";

export type AuthProvider = "password" | "google";

export interface UserLink {
  id: number;
  label: string;
  url: string;
}

/**
 * The authenticated member's own account — matches AuthUserResource.
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  handle: string;
  authProvider: AuthProvider;
  role: UserRole;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  links: UserLink[];
  createdAt: string;
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
 * Shape used by the products list/detail/dashboard pages (see
 * src/lib/products.ts). Founder isn't included yet — add it once a product
 * page needs to show who submitted it.
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
  status: ProductStatus;
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
