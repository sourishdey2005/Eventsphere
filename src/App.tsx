import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
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

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string;[key: string]: any }) => (
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
      const data = err.response?.data;
      const errorBase = typeof data?.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : (data?.error || err.message || 'Login failed');
      const details = data?.details ? ` (${typeof data.details === 'object' ? JSON.stringify(data.details) : data.details})` : '';
      setError(`${errorBase}${details}`);
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
          <img
            src="https://imgs.search.brave.com/tpBdKslGmW0lv4Hgd5d-F16PZSSuFEjvbFvuWvmBapA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzIyLzE0/L2MyLzIyMTRjMjU5/ZGFmNTk3YmMzOGE5/MDdkNDc5NjAyN2M3/LmpwZw"
            alt="KIIT Logo"
            className="mx-auto mb-4 h-24 w-auto rounded-full shadow-lg"
            referrerPolicy="no-referrer"
          />
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
      const data = err.response?.data;
      const errorBase = typeof data?.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : (data?.error || err.message || 'Registration failed');
      const details = data?.details ? ` (${typeof data.details === 'object' ? JSON.stringify(data.details) : data.details})` : '';
      setError(`${errorBase}${details}`);
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
          <img
            src="https://imgs.search.brave.com/tpBdKslGmW0lv4Hgd5d-F16PZSSuFEjvbFvuWvmBapA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzIyLzE0/L2MyLzIyMTRjMjU5/ZGFmNTk3YmMzOGE5/MDdkNDc5NjAyN2M3/LmpwZw"
            alt="KIIT Logo"
            className="mx-auto mb-4 h-24 w-auto rounded-full shadow-lg"
            referrerPolicy="no-referrer"
          />
        </div>
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
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({ points: 0, attendedCount: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data));
    api.get('/student/stats').then(res => setStats(res.data)).catch(() => { });
    api.get('/student/registrations').then(res => setRegistrations(res.data)).catch(() => { });
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getEventsForDate = (date: Date) => {
    return registrations.filter(reg => isSameDay(parseISO(reg.events.event_date), date));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome back, KIITian!</h1>
        <div className="flex gap-4">
          <Card className="flex items-center gap-4 py-3">
            <Trophy className="text-[#FF6B00]" />
            <div>
              <p className="text-xs text-gray-500">Points</p>
              <p className="font-bold">{stats.points.toLocaleString()}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold">Upcoming Events</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {events.slice(0, 4).map(event => (
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
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          await api.post(`/events/${event.id}/register`);
                          alert('Successfully registered!');
                          // Refresh registrations
                          api.get('/student/registrations').then(res => setRegistrations(res.data));
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

        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
                  <Menu size={16} className="rotate-90" />
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
                  <Menu size={16} className="-rotate-90" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative h-10 w-full rounded-lg flex items-center justify-center text-sm transition-colors",
                      !isCurrentMonth && "text-gray-300",
                      isCurrentMonth && "hover:bg-gray-100",
                      isSelected && "bg-[#0B3D91] text-white hover:bg-[#0B3D91]",
                      dayEvents.length > 0 && !isSelected && "bg-orange-50 text-[#FF6B00] font-bold"
                    )}
                  >
                    {format(day, 'd')}
                    {dayEvents.length > 0 && (
                      <div className={cn(
                        "absolute bottom-1 h-1 w-1 rounded-full",
                        isSelected ? "bg-white" : "bg-[#FF6B00]"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t"
                >
                  <h4 className="font-bold text-sm mb-3">Events on {format(selectedDate, 'MMM d, yyyy')}</h4>
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).length > 0 ? (
                      getEventsForDate(selectedDate).map(reg => (
                        <div key={reg.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-sm font-bold text-[#0B3D91]">{reg.events.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{reg.events.societies.name}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                            <QrCode size={12} />
                            <span>Scan QR for entry</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No registered events for this day.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
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
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0 });

  useEffect(() => {
    api.get('/society/events').then(res => {
      setEvents(res.data);
      setStats(prev => ({ ...prev, totalEvents: res.data.length }));
    });
    api.get('/society/participants').then(res => {
      setStats(prev => ({ ...prev, totalRegistrations: res.data.length }));
    });
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Society Management</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Events', value: stats.totalEvents.toString(), icon: Calendar },
          { label: 'Registrations', value: stats.totalRegistrations.toString(), icon: Users },
          { label: 'Upcoming', value: events.filter(e => new Date(e.event_date) > new Date()).length.toString(), icon: Bell },
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
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map(event => (
                <tr key={event.id} className="text-sm">
                  <td className="py-4 font-medium">{event.title}</td>
                  <td className="py-4">{new Date(event.event_date).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      event.verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {event.verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="py-4 flex gap-2">
                    <Link to={`/participants?event_id=${event.id}`}>
                      <Button variant="outline" className="px-2 py-1 text-xs">Participants</Button>
                    </Link>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fic_name: '',
    fic_details: '',
    department: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const res = await api.get('/societies');
      setSocieties(res.data);
    } catch (err) {
      console.error("Failed to fetch societies", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/societies/${editingId}`, formData);
        alert('Society updated successfully');
      } else {
        await api.post('/societies', formData);
        alert('Society and Admin created successfully');
      }
      setEditingId(null);
      setFormData({ name: '', description: '', fic_name: '', fic_details: '', department: '', email: '', password: '' });
      fetchSocieties();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (society: any) => {
    setEditingId(society.id);
    setFormData({
      name: society.name,
      description: society.description || '',
      fic_name: society.fic_name || '',
      fic_details: society.fic_details || '',
      department: society.department || '',
      email: '', // Don't pre-fill sensitive info for edit unless you have a way to update it
      password: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this society? This will remove all associated data.')) return;
    try {
      await api.delete(`/societies/${id}`);
      fetchSocieties();
    } catch (err) {
      alert('Failed to delete society');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Manage Societies</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Society' : 'Add New Society'}</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Society Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">FIC Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.fic_name}
              onChange={e => setFormData({ ...formData, fic_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">FIC Details</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.fic_details}
              onChange={e => setFormData({ ...formData, fic_details: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {!editingId && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" className="flex-1">
              {editingId ? 'Update Society' : 'Create Society'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '', fic_name: '', fic_details: '', department: '', email: '', password: '' });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {societies.map(s => (
          <Card key={s.id} className="relative">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#0B3D91]">{s.name}</h3>
              <p className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">{s.department}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">FIC:</span> {s.fic_name}</p>
              <p className="text-gray-600 italic">"{s.fic_details}"</p>
              <p className="line-clamp-2 text-gray-500">{s.description}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => handleEdit(s)}>Edit</Button>
              <Button variant="outline" className="w-full text-red-600" onClick={() => handleDelete(s.id)}>Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Participants = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchParams] = React.useSearchParams();

  useEffect(() => {
    api.get('/society/events').then(res => {
      setEvents(res.data);
      const eventId = searchParams.get('event_id');
      if (eventId) {
        setSelectedEventId(eventId);
      } else if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedEventId) {
      api.get(`/events/${selectedEventId}/participants`).then(res => setParticipants(res.data));
    }
  }, [selectedEventId]);

  const toggleAttendance = async (regId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/registrations/${regId}/attendance`, { attended: !currentStatus });
      setParticipants(prev => prev.map(p => p.id === regId ? { ...p, attended: !currentStatus } : p));
    } catch (err) {
      alert('Failed to update attendance');
    }
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Status'];
    const rows = participants.map(p => [
      p.users.name,
      p.users.email,
      p.attended ? 'Present' : 'Absent'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `participants_${selectedEventId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Participants</h1>
        <div className="flex gap-4">
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Select Event</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <Button onClick={downloadCSV} variant="outline" className="gap-2">
            Download CSV
          </Button>
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm font-medium text-gray-500">
                <th className="pb-4">Name</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Attendance</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants.map(p => (
                <tr key={p.id} className="text-sm">
                  <td className="py-4 font-medium">{p.users.name}</td>
                  <td className="py-4">{p.users.email}</td>
                  <td className="py-4">
                    <span className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      p.attended ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {p.attended ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td className="py-4">
                    <Button
                      variant="outline"
                      className="px-2 py-1 text-xs"
                      onClick={() => toggleAttendance(p.id, p.attended)}
                    >
                      Mark as {p.attended ? 'Absent' : 'Present'}
                    </Button>
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
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                onChange={e => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="datetime-local"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#0B3D91] focus:outline-none"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
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
              onChange={e => setFormData({ ...formData, max_limit: parseInt(e.target.value) })}
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
    // Requirement: Logout on reload
    // We clear the token every time the app initializes (which happens on reload)
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
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
