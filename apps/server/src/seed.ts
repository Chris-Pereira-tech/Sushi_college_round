import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: "../../.env" });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

async function main() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase URL or service key is missing. Skipping seed.");
    process.exit(0);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Connected to Supabase. Starting seed...");

  try {
    console.log("Deleting existing data...");
    await supabaseAdmin.from("audit_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("deployments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("versions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("patches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Inserting profiles...");
    const devId = '00000000-0000-0000-0000-000000000001';
    const reviewerId = '00000000-0000-0000-0000-000000000002';
    
    await supabaseAdmin.from("profiles").insert([
      { id: devId, email: 'dev@patchwork.io', display_name: 'Demo Developer', role: 'developer' },
      { id: reviewerId, email: 'reviewer@patchwork.io', display_name: 'Demo Reviewer', role: 'reviewer' }
    ]);

    console.log("Inserting patches...");
    const patch1Id = crypto.randomUUID();
    const patch2Id = crypto.randomUUID();
    const patch3Id = crypto.randomUUID();

    const patches = [
      {
        id: patch1Id,
        target_url: 'https://demo.patchwork.io/checkout',
        base_version: 0,
        anchors: { type: 'selector', value: '#checkout-btn' },
        change: { type: 'text', value: 'Complete Order' },
        author_id: devId,
        status: 'approved',
      },
      {
        id: patch2Id,
        target_url: 'https://demo.patchwork.io/checkout',
        base_version: 0,
        anchors: { type: 'selector', value: '#checkout-btn' },
        change: { type: 'style', value: 'background-color: blue;' },
        author_id: devId,
        status: 'approved',
      },
      {
        id: patch3Id,
        target_url: 'https://demo.patchwork.io/checkout',
        base_version: 0,
        anchors: { type: 'selector', value: '.promo-banner' },
        change: { type: 'visibility', value: 'hidden' },
        author_id: devId,
        status: 'approved',
      }
    ];
    await supabaseAdmin.from("patches").insert(patches);

    console.log("Inserting versions...");
    const versionId = crypto.randomUUID();
    await supabaseAdmin.from("versions").insert({
      id: versionId,
      number: 1,
      patch_ids: [patch1Id, patch2Id, patch3Id],
      created_by: devId,
      verification_status: 'passed'
    });

    console.log("Inserting deployments...");
    const deploymentId = crypto.randomUUID();
    await supabaseAdmin.from("deployments").insert({
      id: deploymentId,
      version_id: versionId,
      is_live: true,
      canary_percent: 100
    });

    console.log("Inserting audit events...");
    const auditEvents = [
      { actor_id: devId, event_type: 'PATCH_CREATED', entity_id: patch1Id },
      { actor_id: devId, event_type: 'PATCH_CREATED', entity_id: patch2Id },
      { actor_id: devId, event_type: 'PATCH_CREATED', entity_id: patch3Id },
      { actor_id: reviewerId, event_type: 'VERSION_VERIFIED', entity_id: versionId },
      { actor_id: devId, event_type: 'DEPLOYMENT_CREATED', entity_id: deploymentId },
    ];
    await supabaseAdmin.from("audit_events").insert(auditEvents);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("Error during seed:", error);
    process.exit(1);
  }
}

main();
