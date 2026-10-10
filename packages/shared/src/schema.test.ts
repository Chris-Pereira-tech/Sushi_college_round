import { describe, it, expect } from "vitest";
import {
  PatchSchema,
  PatchChangeSchema,
  PatchStatusSchema,
  CreatePatchSchema,
  AuditEventSchema,
  DeploymentSchema
} from "./schema.js";

describe("PatchSchema", () => {
  it("parses a valid patch successfully", () => {
    const validPatch = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      target_url: "https://example.com/page",
      base_version: 1,
      anchors: {
        cssSelector: ".header",
        xpath: "//header",
        textContent: "Welcome",
        attributes: { class: "header main" },
        parentContext: "body",
        siblingContext: ["div.nav"]
      },
      change: {
        type: "text" as const,
        value: "New Welcome"
      },
      author_id: "123e4567-e89b-12d3-a456-426614174001",
      status: "draft" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = PatchSchema.safeParse(validPatch);
    expect(result.success).toBe(true);
  });

  it("throws ZodError for invalid Patch (missing id)", () => {
    const invalidPatch = {
      target_url: "https://example.com/page",
      base_version: 1,
      anchors: {
        cssSelector: ".header",
        xpath: "//header",
        textContent: "Welcome",
        attributes: {},
        parentContext: "body",
        siblingContext: []
      },
      change: {
        type: "text",
        value: "New Welcome"
      },
      author_id: "123e4567-e89b-12d3-a456-426614174001",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = PatchSchema.safeParse(invalidPatch);
    expect(result.success).toBe(false);
  });
});

describe("PatchChangeSchema", () => {
  it("validates each change type", () => {
    expect(PatchChangeSchema.safeParse({ type: "text", value: "x" }).success).toBe(true);
    expect(PatchChangeSchema.safeParse({ type: "style", value: "x" }).success).toBe(true);
    expect(PatchChangeSchema.safeParse({ type: "visibility", value: "x" }).success).toBe(true);
    expect(PatchChangeSchema.safeParse({ type: "script", value: "x" }).success).toBe(true);
  });

  it("rejects invalid change type", () => {
    expect(PatchChangeSchema.safeParse({ type: "html", value: "x" }).success).toBe(false);
  });
});

describe("PatchStatusSchema", () => {
  it("accepts all valid values", () => {
    const statuses = ["draft", "approved", "live", "broken", "healed"];
    statuses.forEach(status => {
      expect(PatchStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  it("rejects invalid values", () => {
    expect(PatchStatusSchema.safeParse("unknown").success).toBe(false);
  });
});

describe("CreatePatchSchema", () => {
  it("omits id/timestamps/status correctly", () => {
    const createPatch = {
      target_url: "https://example.com",
      base_version: 0,
      anchors: {
        cssSelector: ".a",
        xpath: "//a",
        textContent: "b",
        attributes: {},
        parentContext: "c",
        siblingContext: []
      },
      change: { type: "text" as const, value: "d" },
      author_id: "123e4567-e89b-12d3-a456-426614174001"
    };
    const result = CreatePatchSchema.safeParse(createPatch);
    expect(result.success).toBe(true);
  });
});

describe("AuditEventSchema", () => {
  it("validates correctly", () => {
    const event = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      actor_id: "123e4567-e89b-12d3-a456-426614174001",
      event_type: "patch_created" as const,
      entity_id: "123e4567-e89b-12d3-a456-426614174002",
      details: { any: "detail" },
      created_at: new Date().toISOString()
    };
    expect(AuditEventSchema.safeParse(event).success).toBe(true);
  });
});

describe("DeploymentSchema", () => {
  it("validates with null rolled_back_at", () => {
    const deployment = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      version_id: "123e4567-e89b-12d3-a456-426614174001",
      is_live: true,
      canary_percent: 100,
      deployed_at: new Date().toISOString(),
      rolled_back_at: null
    };
    expect(DeploymentSchema.safeParse(deployment).success).toBe(true);
  });
});
