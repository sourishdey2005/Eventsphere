import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  PlusCircle, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Bell,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from './lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'society_admin' | 'super_admin';
  society_id?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_date: string;
  max_limit: number;
  verified: boolean;
  societies?: { name: string };
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#0B3D91] text-white hover:bg-[#082d6b]',
      secondary: 'bg-[#FF6B00] text-white hover:bg-[#e66000]',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
      ghost: 'bg-transparent hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)} {...props}>
    {children}
  </div>
);

// --- Pages ---

const Login = ({ setUser }: { setUser: (u: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#0B3D91]">KIIT EventSphere</h1>
          <p className="mt-2 text-gray-600">Smart Campus Event Management</p>
        </div>
        <Card>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-[#0B3D91] hover:underline">Register</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <h2 className="mb-6 text-2xl font-bold text-[#0B3D91]">Create Account</h2>
          {success ? (
            <div className="text-center text-green-600">Registration successful! Redirecting...</div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">KIIT Email (@kiit.ac.in)</label>
                <input
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">Register</Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-[#0B3D91] hover:underline">Login</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const DashboardLayout = ({ user, setUser, children }: { user: User; setUser: (u: User | null) => void; children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    ...(user.role === 'student' ? [{ icon: CheckCircle, label: 'My Registrations', path: '/my-registrations' }] : []),
    ...(user.role === 'society_admin' ? [
      { icon: PlusCircle, label: 'Create Event', path: '/create-event' },
      { icon: Users, label: 'Participants', path: '/participants' }
    ] : []),
    ...(user.role === 'super_admin' ? [
      { icon: ShieldCheck, label: 'Verify Events', path: '/verify-events' },
      { icon: Users2, label: 'Societies', path: '/manage-societies' }
    ] : []),
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#0B3D91] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6">
          <span className="text-xl font-bold">EventSphere</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={24} /></button>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={24} /></button>
          <div className="flex items-center gap-4">
            <Bell size={20} className="text-gray-500" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-white font-bold">
                {user.name[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome back, KIITian!</h1>
        <div className="flex gap-4">
          <Card className="flex items-center gap-4 py-3">
            <Trophy className="text-[#FF6B00]" />
            <div>
              <p className="text-xs text-gray-500">Points</p>
              <p className="font-bold">1,250</p>
            </div>
          </Card>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Upcoming Events</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <motion.div key={event.id} whileHover={{ y: -5 }}>
              <Card className="h-full flex flex-col">
                <div className="mb-4 h-40 w-full rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={`https://picsum.photos/seed/${event.id}/400/200`} alt="Event" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">{event.societies?.name || 'Society'}</span>
                  <h3 className="mt-1 text-xl font-bold">{event.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={16} />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <Users size={16} />
                    Max {event.max_limit} participants
                  </div>
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      await api.post(`/events/${event.id}/register`);
                      alert('Successfully registered!');
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Registration failed');
                    }
                  }}
                  className="mt-6 w-full"
                >
                  Register Now
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    api.get('/student/registrations').then(res => setRegistrations(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Registered Events</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {registrations.map(reg => (
          <Card key={reg.id} className="flex gap-6">
            <div className="h-32 w-32 flex-shrink-0 bg-white p-2 border rounded-lg">
              <img src={reg.qr_code} alt="QR Code" className="w-full h-full" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{reg.events.title}</h3>
              <p className="text-sm text-gray-600">{reg.events.societies.name}</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  {new Date(reg.events.event_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <QrCode size={14} />
                  Scan at venue
                </div>
              </div>
              <div className="mt-4">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  reg.attended ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                )}>
                  {reg.attended ? "Attended" : "Registered"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SocietyAdminDashboard = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Society Management</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Events', value: '12', icon: Calendar },
          { label: 'Registrations', value: '458', icon: Users },
          { label: 'Upcoming', value: '3', icon: Bell },
          { label: 'Engagement', value: '84%', icon: Trophy },
        ].map(stat => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className="rounded-lg bg-[#0B3D91]/10 p-3 text-[#0B3D91]">
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
      
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Your Events</h2>
          <Link to="/create-event">
            <Button className="gap-2"><PlusCircle size={18} /> Create New</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm font-medium text-gray-500">
                <th className="pb-4">Event Name</th>
                <th className="pb-4">Date</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Registrations</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3].map(i => (
                <tr key={i} className="text-sm">
                  <td className="py-4 font-medium">Tech Workshop {i}</td>
                  <td className="py-4">Oct 24, 2026</td>
                  <td className="py-4">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Verified</span>
                  </td>
                  <td className="py-4">120/150</td>
                  <td className="py-4 flex gap-2">
                    <Button variant="outline" className="px-2 py-1 text-xs">Edit</Button>
                    <Button variant="outline" className="px-2 py-1 text-xs text-red-600">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [unverifiedEvents, setUnverifiedEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
    api.get('/events/unverified').then(res => setUnverifiedEvents(res.data));
  }, []);

  const handleVerify = async (id: string) => {
    await api.patch(`/events/${id}/verify`);
    setUnverifiedEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Global Overview</h1>
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="bg-[#0B3D91] text-white">
          <p className="text-sm opacity-80">Total Students</p>
          <p className="text-3xl font-bold">{stats?.students || 0}</p>
        </Card>
        <Card className="bg-[#FF6B00] text-white">
          <p className="text-sm opacity-80">Active Societies</p>
          <p className="text-3xl font-bold">{stats?.societies || 0}</p>
        </Card>
        <Card className="bg-emerald-600 text-white">
          <p className="text-sm opacity-80">Total Registrations</p>
          <p className="text-3xl font-bold">{stats?.registrations || 0}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-6 text-lg font-semibold">Pending Approvals</h2>
        <div className="space-y-4">
          {unverifiedEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No events pending verification</p>
          ) : (
            unverifiedEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.societies?.name} • {new Date(event.event_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleVerify(event.id)} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                  <Button variant="outline" className="text-red-600">Reject</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

const ManageSocieties = () => {
  const [societies, setSocieties] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    api.get('/societies').then(res => setSocieties(res.data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/societies', { name, description });
      setSocieties([...societies, res.data]);
      setName('');
      setDescription('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create society');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Manage Societies</h1>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Add New Society</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="Society Name"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description"
            className="flex-2 rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Button type="submit">Add Society</Button>
        </form>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {societies.map(s => (
          <Card key={s.id}>
            <h3 className="text-xl font-bold">{s.name}</h3>
            <p className="mt-2 text-sm text-gray-600">{s.description}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="w-full">Edit</Button>
              <Button variant="outline" className="w-full text-red-600">Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Participants = () => {
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    api.get('/society/participants').then(res => setParticipants(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Event Participants</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm font-medium text-gray-500">
                <th className="pb-4">Name</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Event</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants.map(p => (
                <tr key={p.id} className="text-sm">
                  <td className="py-4 font-medium">{p.users.name}</td>
                  <td className="py-4">{p.users.email}</td>
                  <td className="py-4">{p.events.title}</td>
                  <td className="py-4">
                    <span className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      p.attended ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {p.attended ? "Attended" : "Registered"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    event_date: '',
    max_limit: 100
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      alert('Event created and sent for approval!');
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Title</label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Venue</label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                value={formData.venue}
                onChange={e => setFormData({...formData, venue: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="datetime-local"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                value={formData.event_date}
                onChange={e => setFormData({...formData, event_date: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Participants</label>
            <input
              type="number"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.max_limit}
              onChange={e => setFormData({...formData, max_limit: parseInt(e.target.value)})}
            />
          </div>
          <Button type="submit" className="w-full">Submit for Approval</Button>
        </form>
      </Card>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, verify token and fetch user
      // For this demo, we'll assume it's valid if present
      // and let the API calls handle errors
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />

        <Route path="/dashboard" element={
          user ? (
            <DashboardLayout user={user} setUser={setUser}>
              {user.role === 'student' && <StudentDashboard />}
              {user.role === 'society_admin' && <SocietyAdminDashboard />}
              {user.role === 'super_admin' && <SuperAdminDashboard />}
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/events" element={
          user ? (
            <DashboardLayout user={user} setUser={setUser}>
              <StudentDashboard />
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/my-registrations" element={
          user?.role === 'student' ? (
            <DashboardLayout user={user} setUser={setUser}>
              <MyRegistrations />
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/create-event" element={
          user?.role === 'society_admin' ? (
            <DashboardLayout user={user} setUser={setUser}>
              <CreateEvent />
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/verify-events" element={
          user?.role === 'super_admin' ? (
            <DashboardLayout user={user} setUser={setUser}>
              <SuperAdminDashboard />
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/participants" element={
          user?.role === 'society_admin' ? (
            <DashboardLayout user={user} setUser={setUser}>
              <Participants />
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/manage-societies" element={
          user?.role === 'super_admin' ? (
            <DashboardLayout user={user} setUser={setUser}>
              <ManageSocieties />
            </DashboardLayout>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}
