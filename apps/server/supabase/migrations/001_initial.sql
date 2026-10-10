-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('developer', 'reviewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patches table
CREATE TABLE patches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_url TEXT NOT NULL,
  base_version INTEGER NOT NULL DEFAULT 0,
  anchors JSONB NOT NULL,
  change JSONB NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'live', 'broken', 'healed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Versions table  
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  patch_ids UUID[] NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'passed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES versions(id),
  is_live BOOLEAN NOT NULL DEFAULT false,
  canary_percent INTEGER NOT NULL DEFAULT 100 CHECK (canary_percent >= 0 AND canary_percent <= 100),
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rolled_back_at TIMESTAMPTZ
);

-- Audit events table
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patches_status ON patches(status);
CREATE INDEX idx_patches_author ON patches(author_id);
CREATE INDEX idx_patches_url ON patches(target_url);
CREATE INDEX idx_deployments_live ON deployments(is_live) WHERE is_live = true;
CREATE INDEX idx_audit_events_entity ON audit_events(entity_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can read all
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can read patches" ON patches FOR SELECT USING (true);
CREATE POLICY "Anyone can read versions" ON versions FOR SELECT USING (true);
CREATE POLICY "Anyone can read deployments" ON deployments FOR SELECT USING (true);
CREATE POLICY "Anyone can read audit_events" ON audit_events FOR SELECT USING (true);

-- Authors can insert/update their own patches
CREATE POLICY "Users can create patches" ON patches FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own patches" ON patches FOR UPDATE USING (auth.uid() = author_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE patches;
ALTER PUBLICATION supabase_realtime ADD TABLE deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_events;
