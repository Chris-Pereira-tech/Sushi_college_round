import type { PatchAnchor } from "./types.js";

export interface MatchResult {
  element: string; // CSS selector of best match
  score: number; // 0-1 overall confidence
  breakdown: {
    selector: number;
    text: number;
    attributes: number;
    parent: number;
    sibling: number;
  };
}

/**
 * Find the best matching element for a patch anchor.
 * Stub — implemented in Phase 2.
 */
export function findBestMatch(
  _anchor: PatchAnchor,
  _candidates: string[]
): MatchResult | null {
  return null;
}
