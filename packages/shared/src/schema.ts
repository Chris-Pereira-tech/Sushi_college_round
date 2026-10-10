import { z } from "zod";

// Patch anchor — describes how to find the target element
export const PatchAnchorSchema = z.object({
  cssSelector: z.string(),
  xpath: z.string(),
  textContent: z.string(),
  attributes: z.record(z.string()),
  parentContext: z.string().describe("CSS selector of parent chain"),
  siblingContext: z.array(z.string()).describe("Text/tag of adjacent siblings"),
});

// Patch change — what to modify
export const PatchChangeSchema = z.object({
  type: z.enum(["text", "style", "visibility", "script"]),
  value: z.string(),
});

// Patch status
export const PatchStatusSchema = z.enum(["draft", "approved", "live", "broken", "healed"]);

// Full Patch
export const PatchSchema = z.object({
  id: z.string().uuid(),
  target_url: z.string().url(),
  base_version: z.number().int().nonnegative(),
  anchors: PatchAnchorSchema,
  change: PatchChangeSchema,
  author_id: z.string().uuid(),
  status: PatchStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// For creating a new patch (server assigns id, timestamps)
export const CreatePatchSchema = PatchSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  status: true,
});

// Version — a bundle of approved patches
export const VerificationStatusSchema = z.enum(["pending", "passed", "failed"]);

export const VersionSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  patch_ids: z.array(z.string().uuid()),
  created_by: z.string().uuid(),
  verification_status: VerificationStatusSchema,
  created_at: z.string().datetime(),
});

// Deployment
export const DeploymentSchema = z.object({
  id: z.string().uuid(),
  version_id: z.string().uuid(),
  is_live: z.boolean(),
  canary_percent: z.number().min(0).max(100).default(100),
  deployed_at: z.string().datetime(),
  rolled_back_at: z.string().datetime().nullable(),
});

// Audit event
export const AuditEventTypeSchema = z.enum([
  "patch_created",
  "patch_updated",
  "patch_approved",
  "patch_healed",
  "patch_broken",
  "version_created",
  "deployment_created",
  "deployment_rolled_back",
  "verification_passed",
  "verification_failed",
  "conflict_detected",
]);

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  actor_id: z.string().uuid(),
  event_type: AuditEventTypeSchema,
  entity_id: z.string().uuid(),
  details: z.record(z.unknown()),
  created_at: z.string().datetime(),
});
