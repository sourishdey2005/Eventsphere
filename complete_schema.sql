-- ==========================================
-- KIIT EventSphere - Complete Database Schema
-- ==========================================

-- 1. CLEANUP (Drop in reverse order of dependency)
DROP TABLE IF EXISTS society_members;
DROP TABLE IF EXISTS event_registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS approved_society_admins;
ALTER TABLE IF EXISTS societies DROP CONSTRAINT IF EXISTS fk_societies_created_by;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS societies;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CREATE SOCIETIES (Initial)
CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  fic_name TEXT,
  fic_details TEXT,
  department TEXT,
  created_by UUID, -- Foreign key added later to avoid circularity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE USERS
-- Roles: 'student', 'society_admin', 'super_admin'
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'society_admin', 'super_admin')),
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. LINK SOCIETIES BACK TO USERS
ALTER TABLE societies 
ADD CONSTRAINT fk_societies_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. CREATE APPROVED ADMINS
-- Pre-approve emails that can register as society admins
CREATE TABLE approved_society_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE
);

-- 7. CREATE EVENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  venue TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_limit INTEGER NOT NULL,
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CREATE EVENT REGISTRATIONS
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT,
  attended BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, student_id)
);

-- 9. CREATE SOCIETY MEMBERS
CREATE TABLE society_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(society_id, student_id)
);

-- 10. DISABLE ROW LEVEL SECURITY (REQUIRED FOR BACKEND ACCESS)
-- Since the backend uses the service/anon key but doesn't have complex RLS policies yet,
-- we disable it to allow full operation.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE society_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE approved_society_admins DISABLE ROW LEVEL SECURITY;

-- 11. INITIAL SEED (OPTIONAL)
-- Note: Super Admin (admin@kiit.ac.in) is hardcoded in the backend
-- so no initial user entry is strictly required for the first login.
