import express from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase URL or Key is missing from environment variables!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || "kiit-eventsphere-secret-2026";
const HARDCODED_SUPER_ADMIN_ID = "00000000-0000-0000-0000-000000000000";

app.use(express.json());

// --- Middlewares ---

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

// --- Health Check ---

app.get("/api/health", async (req, res) => {
  console.log("[HEALTH] Health check request received");
  try {
    const results: any = {
      status: "ok",
      timestamp: new Date().toISOString(),
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 15) + "..." : "missing"
      }
    };

    // Check users table for data and permissions
    const { data: users, count, error: userError } = await supabase
      .from("users")
      .select("*", { count: 'exact', head: false })
      .limit(1);

    results.database = {
      connected: !userError || userError.code !== 'PGRST301',
      usersTable: userError ? (userError.code === '42P01' ? "missing" : "error") : "ok",
      userCount: count,
      error: userError ? {
        message: userError.message,
        code: userError.code,
        hint: userError.hint,
      } : null,
      rlsStatus: userError?.code === '42501' ? "active (BLOCKING - run schema.sql to fix)" : "ok"
    };

    console.log("[HEALTH] Diagnostic results:", JSON.stringify(results, null, 2));
    res.json(results);
  } catch (err: any) {
    console.error("[HEALTH] Unexpected health check error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// --- Auth Routes ---

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt: email=${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Hardcoded Super Admin
    if (email === "admin@kiit.ac.in" && password === "admin@kiit") {
      console.log("[AUTH] Super Admin login detected");
      const token = jwt.sign({ id: HARDCODED_SUPER_ADMIN_ID, email, role: "super_admin" }, JWT_SECRET);
      return res.json({ token, user: { id: HARDCODED_SUPER_ADMIN_ID, email, role: "super_admin", name: "Super Admin" } });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.warn(`[AUTH] Login database error for ${email}:`, error.message, "code:", error.code);
      if (error.code === 'PGRST116') return res.status(400).json({ error: "User not found" });
      if (error.code === '42501') return res.status(500).json({ error: "Database permission denied. RLS is active. Please run complete_schema.sql in Supabase." });
      return res.status(500).json({ error: "Database error: " + error.message });
    }

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    console.log(`[AUTH] Login successful for: ${email}`);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, society_id: user.society_id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, society_id: user.society_id } });
  } catch (err: any) {
    console.error("[AUTH] Unexpected error during login:", err);
    res.status(500).json({ error: "Server error: " + (err.message || "Unknown error") });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log(`[AUTH] Registration attempt: name=${name}, email=${email}`);

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (!email.endsWith("@kiit.ac.in")) {
    return res.status(400).json({ error: "Only KIIT emails are allowed (@kiit.ac.in)" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role: "student" }])
      .select();

    if (error) {
      console.error("[DB] Supabase error during registration:", JSON.stringify(error));

      if (error.code === '42P01') {
        return res.status(500).json({ error: "Table 'users' not found. Run complete_schema.sql in Supabase." });
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: "Email already registered. Please login instead." });
      }
      if (error.code === '42501') {
        return res.status(500).json({ error: "Database permission denied. RLS is active. Please run complete_schema.sql in Supabase." });
      }
      if (error.message?.includes('uuid_generate_v4')) {
        return res.status(500).json({ error: "Missing 'uuid-ossp' extension. Run complete_schema.sql in Supabase." });
      }

      return res.status(400).json({ error: error.message || "Registration failed" });
    }

    console.log("[DB] User registered successfully");
    res.json({ message: "Registration successful! Please login." });
  } catch (err: any) {
    console.error("[AUTH] Unexpected error during registration:", err);
    res.status(500).json({ error: "Server error: " + (err.message || "Unknown error") });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const { id } = (req as any).user;

  if (id === HARDCODED_SUPER_ADMIN_ID) {
    return res.json({ id: HARDCODED_SUPER_ADMIN_ID, email: "admin@kiit.ac.in", role: "super_admin", name: "Super Admin" });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, society_id")
    .eq("id", id)
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// --- Event Routes ---

app.get("/api/events", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*, societies(name)")
    .eq("verified", true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get("/api/events/unverified", authenticateToken, authorizeRoles("super_admin"), async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*, societies(name)")
    .eq("verified", false);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/api/events", authenticateToken, authorizeRoles("society_admin"), async (req, res) => {
  const { title, description, venue, event_date, max_limit } = req.body;
  const { data, error } = await supabase
    .from("events")
    .insert([{
      title,
      description,
      venue,
      event_date,
      max_limit,
      society_id: (req as any).user.society_id,
      created_by: (req as any).user.id,
      verified: false
    }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.patch("/api/events/:id/verify", authenticateToken, authorizeRoles("super_admin"), async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .update({ verified: true })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// --- Registration Routes ---

app.post("/api/events/:id/register", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const eventId = req.params.id;
  const studentId = (req as any).user.id;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("max_limit, society_id")
    .eq("id", eventId)
    .single();

  if (eventError) return res.status(400).json({ error: "Event not found" });

  const { count, error: countError } = await supabase
    .from("event_registrations")
    .select("*", { count: 'exact', head: true })
    .eq("event_id", eventId);

  if ((count || 0) >= event.max_limit) {
    return res.status(400).json({ error: "Event is full" });
  }

  const qrData = JSON.stringify({ eventId, studentId, timestamp: Date.now() });
  const qrCode = await QRCode.toDataURL(qrData);

  const { error: regError } = await supabase
    .from("event_registrations")
    .insert([{ event_id: eventId, student_id: studentId, qr_code: qrCode }]);

  if (regError) return res.status(400).json({ error: regError.code === '23505' ? "Already registered for this event" : regError.message });

  await supabase
    .from("society_members")
    .upsert([{ society_id: event.society_id, student_id: studentId }], { onConflict: 'society_id,student_id' });

  res.json({ message: "Registered successfully!", qrCode });
});

app.get("/api/student/registrations", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, events(*, societies(name))")
    .eq("student_id", (req as any).user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get("/api/student/stats", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const studentId = (req as any).user.id;

  const { data, error } = await supabase
    .from("event_registrations")
    .select("attended")
    .eq("student_id", studentId)
    .eq("attended", true);

  if (error) return res.status(400).json({ error: error.message });

  const points = (data?.length || 0) * 100;
  res.json({ points, attendedCount: data?.length || 0 });
});

app.get("/api/events/:id/participants", authenticateToken, authorizeRoles("society_admin", "super_admin"), async (req, res) => {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, users(name, email)")
    .eq("event_id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.patch("/api/registrations/:id/attendance", authenticateToken, authorizeRoles("society_admin"), async (req, res) => {
  const { attended } = req.body;
  const { data, error } = await supabase
    .from("event_registrations")
    .update({ attended })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// --- Society Routes ---

app.get("/api/societies", async (req, res) => {
  const { data, error } = await supabase
    .from("societies")
    .select("*");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/api/societies", authenticateToken, authorizeRoles("super_admin"), async (req, res) => {
  const { name, description, fic_name, fic_details, department, email, password } = req.body;

  const creatorId = (req as any).user.id === HARDCODED_SUPER_ADMIN_ID ? null : (req as any).user.id;

  const { data: society, error: societyError } = await supabase
    .from("societies")
    .insert([{ name, description, fic_name, fic_details, department, created_by: creatorId }])
    .select()
    .single();

  if (societyError) return res.status(400).json({ error: societyError.message });

  if (email && password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: userError } = await supabase
      .from("users")
      .insert([{
        name: `${name} Admin`,
        email,
        password: hashedPassword,
        role: "society_admin",
        society_id: society.id
      }]);

    if (userError) {
      await supabase.from("societies").delete().eq("id", society.id);
      return res.status(400).json({ error: "Failed to create society admin: " + userError.message });
    }
  }

  res.json(society);
});

app.patch("/api/societies/:id", authenticateToken, authorizeRoles("super_admin"), async (req, res) => {
  const { name, description, fic_name, fic_details, department } = req.body;
  const { data, error } = await supabase
    .from("societies")
    .update({ name, description, fic_name, fic_details, department })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete("/api/societies/:id", authenticateToken, authorizeRoles("super_admin"), async (req, res) => {
  const { error } = await supabase
    .from("societies")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Society deleted successfully" });
});

app.get("/api/society/events", authenticateToken, authorizeRoles("society_admin"), async (req, res) => {
  const societyId = (req as any).user.society_id;
  const { data, error } = await supabase
    .from("events")
    .select("*, societies(name)")
    .eq("society_id", societyId);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get("/api/society/participants", authenticateToken, authorizeRoles("society_admin"), async (req, res) => {
  const societyId = (req as any).user.society_id;
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, users(name, email), events(title)")
    .eq("events.society_id", societyId);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// --- Admin Analytics ---

app.get("/api/admin/stats", authenticateToken, authorizeRoles("super_admin"), async (req, res) => {
  const { count: students } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq("role", "student");
  const { count: societies } = await supabase.from("societies").select("*", { count: 'exact', head: true });
  const { count: registrations } = await supabase.from("event_registrations").select("*", { count: 'exact', head: true });

  res.json({ students, societies, registrations });
});

// --- Global Error Handler ---
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[GLOBAL ERROR]", err);
  res.status(500).json({ error: "An unexpected error occurred: " + (err.message || "Unknown error") });
});

// --- Start Dev Server (only when NOT running on Vercel) ---
if (process.env.NODE_ENV !== "production") {
  async function startDev() {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Dev server running on http://localhost:${PORT}`);
    });
  }
  startDev();
}

export default app;
