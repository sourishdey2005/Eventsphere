import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://xizdgcgzmnnwlcpxgham.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || "kiit-eventsphere-secret-2026";

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

// --- Auth Routes ---

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // Hardcoded Super Admin
  if (email === "admin@kiit.ac.in" && password === "admin@kiit") {
    const token = jwt.sign({ id: "super-admin-id", email, role: "super_admin" }, JWT_SECRET);
    return res.json({ token, user: { email, role: "super_admin", name: "Super Admin" } });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) return res.status(400).json({ error: "User not found" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, society_id: user.society_id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, society_id: user.society_id } });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email.endsWith("@kiit.ac.in")) {
    return res.status(400).json({ error: "Only KIIT emails are allowed" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password: hashedPassword, role: "student" }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Registration successful" });
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const { id } = (req as any).user;
  
  // Handle hardcoded admin
  if (id === "super-admin-id") {
    return res.json({ id: "super-admin-id", email: "admin@kiit.ac.in", role: "super_admin", name: "Super Admin" });
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

  // 1. Check if seats available
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

  // 2. Generate QR Code
  const qrData = JSON.stringify({ eventId, studentId, timestamp: Date.now() });
  const qrCode = await QRCode.toDataURL(qrData);

  // 3. Add to registrations
  const { error: regError } = await supabase
    .from("event_registrations")
    .insert([{ event_id: eventId, student_id: studentId, qr_code: qrCode }]);

  if (regError) return res.status(400).json({ error: "Already registered" });

  // 4. Add to society members
  await supabase
    .from("society_members")
    .upsert([{ society_id: event.society_id, student_id: studentId }], { onConflict: 'society_id,student_id' });

  res.json({ message: "Registered successfully", qrCode });
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
  
  const points = (data?.length || 0) * 100; // 100 points per attended event
  res.json({ points, attendedCount: data?.length || 0 });
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
  const { name, description } = req.body;
  const { data, error } = await supabase
    .from("societies")
    .insert([{ name, description, created_by: (req as any).user.id }])
    .select()
    .single();

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

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
