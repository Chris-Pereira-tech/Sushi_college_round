import { z } from "zod";
import {
  PatchAnchorSchema,
  PatchChangeSchema,
  PatchSchema,
  CreatePatchSchema,
  VersionSchema,
  DeploymentSchema,
  AuditEventSchema,
  PatchStatusSchema,
  VerificationStatusSchema,
  AuditEventTypeSchema,
} from "./schema.js";

export type PatchAnchor = z.infer<typeof PatchAnchorSchema>;
export type PatchChange = z.infer<typeof PatchChangeSchema>;
export type Patch = z.infer<typeof PatchSchema>;
export type CreatePatch = z.infer<typeof CreatePatchSchema>;
export type PatchStatus = z.infer<typeof PatchStatusSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;
