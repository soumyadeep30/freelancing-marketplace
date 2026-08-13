import React, { useState, useEffect, useRef } from "react";
import { Search, X, Star, ArrowRight, Send, Check, ShieldCheck, Clock, Briefcase, LogIn, LogOut, Loader2, AlertCircle } from "lucide-react";

// Point this at wherever the Fieldwork API is running. See the backend's
// README.md — `npm run dev` serves it on http://localhost:4000 by default.
const API_BASE_URL = "http://localhost:4000/api";
const TOKEN_KEY = "fieldwork_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Thin fetch wrapper: attaches the JSON content type, optionally attaches
// the bearer token, and normalizes the backend's { error: { message } }
// shape into a thrown Error so callers can just try/catch.
async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error("Can't reach the Fieldwork API. Is the backend running?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Something went wrong. Please try again.");
  }
  return data;
}

const CATEGORY_COLOR = {
  Design: "#B45309",
  Development: "#1D4ED8",
  Writing: "#9D174D",
  Marketing: "#B45309",
  Video: "#0F766E",
  Audio: "#6D28D9",
};
const CATEGORIES = Object.keys(CATEGORY_COLOR);

// Used as an instant-paint fallback while the real data loads from the API,
// and as an offline fallback if the backend can't be reached.
const INITIAL_GIGS = [
  {
    id: "g1",
    title: "Brand identity for a climbing gym",
    category: "Design",
    budget: "$1,200",
    type: "Fixed price",
    posted: "2h ago",
    remote: true,
    desc: "Logo suite, signage system, and a small brand book for a new bouldering gym opening this fall. Looking for something bold that survives chalk dust and low light.",
    tags: ["Logo", "Branding", "Illustrator"],
  },
  {
    id: "g2",
    title: "React dashboard for a logistics startup",
    category: "Development",
    budget: "$45/hr",
    type: "Hourly",
    posted: "5h ago",
    remote: true,
    desc: "Building out a fleet-tracking dashboard. Need someone comfortable with React, TypeScript, and wiring up a REST API. Ongoing work, 15-20 hrs/week.",
    tags: ["React", "TypeScript", "API"],
  },
  {
    id: "g3",
    title: "Ghostwrite a 12-part newsletter series",
    category: "Writing",
    budget: "$2,400",
    type: "Fixed price",
    posted: "1d ago",
    remote: true,
    desc: "B2B SaaS newsletter, weekly cadence. I'll supply the outlines and interview notes, you supply the voice. Prior fintech or SaaS writing preferred.",
    tags: ["Newsletter", "SaaS", "B2B"],
  },
  {
    id: "g4",
    title: "Launch campaign for a kombucha brand",
    category: "Marketing",
    budget: "$3,000",
    type: "Fixed price",
    posted: "3h ago",
    remote: true,
    desc: "Full-funnel launch: paid social, a seeding list for micro-influencers, and a two-week content calendar. Regional launch, expanding nationally in spring.",
    tags: ["Social", "Paid ads", "Strategy"],
  },
  {
    id: "g5",
    title: "Edit a 20-minute documentary short",
    category: "Video",
    budget: "$1,800",
    type: "Fixed price",
    posted: "6h ago",
    remote: true,
    desc: "Raw footage from a three-day shoot needs a full edit pass: assembly, color, and a sound sweeten. Festival deadline in six weeks.",
    tags: ["Premiere", "Color", "Sound"],
  },
  {
    id: "g6",
    title: "Podcast mixing, 8 episodes",
    category: "Audio",
    budget: "$60/hr",
    type: "Hourly",
    posted: "1d ago",
    remote: true,
    desc: "Weekly interview show, two hosts and a rotating guest. Need clean mixing and mastering, plus a consistent intro/outro bed.",
    tags: ["Mixing", "Mastering", "Audition"],
  },
  {
    id: "g7",
    title: "Shopify theme customization",
    category: "Development",
    budget: "$900",
    type: "Fixed price",
    posted: "4h ago",
    remote: true,
    desc: "Custom sections for a product bundling flow, plus some Liquid and CSS cleanup on an existing theme. Small scope, quick turnaround wanted.",
    tags: ["Shopify", "Liquid", "CSS"],
  },
  {
    id: "g8",
    title: "Pitch deck redesign, 18 slides",
    category: "Design",
    budget: "$700",
    type: "Fixed price",
    posted: "8h ago",
    remote: true,
    desc: "Series A deck needs a visual pass — same content, better story flow and a system that scales to future updates without a redesign each round.",
    tags: ["Figma", "Keynote", "Storytelling"],
  },
  {
    id: "g9",
    title: "Technical docs for an API v3 migration",
    category: "Writing",
    budget: "$40/hr",
    type: "Hourly",
    posted: "2d ago",
    remote: true,
    desc: "Rewriting our developer docs to cover breaking changes in v3. Markdown source, existing style guide provided. Some DevRel experience helpful.",
    tags: ["Docs", "Markdown", "DevRel"],
  },
];

// Same idea as INITIAL_GIGS: instant-paint + offline fallback.
const FREELANCERS = [
  { id: "f1", name: "Mara Ilić", role: "Brand & identity designer", rate: "$75/hr", rating: 4.9, reviews: 128, skills: ["Logo", "Illustrator", "Branding"], available: true, color: "#B45309" },
  { id: "f2", name: "Ken Osei", role: "Full-stack developer", rate: "$95/hr", rating: 5.0, reviews: 94, skills: ["React", "Node", "Postgres"], available: true, color: "#1D4ED8" },
  { id: "f3", name: "Priya Nathan", role: "Content strategist & writer", rate: "$65/hr", rating: 4.8, reviews: 211, skills: ["SEO", "Newsletters", "B2B"], available: false, color: "#9D174D" },
  { id: "f4", name: "Diego Fuentes", role: "Video editor", rate: "$70/hr", rating: 4.9, reviews: 76, skills: ["Premiere", "Color grading"], available: true, color: "#0F766E" },
  { id: "f5", name: "Sana Kader", role: "Growth marketer", rate: "$80/hr", rating: 4.7, reviews: 58, skills: ["Paid social", "Lifecycle"], available: true, color: "#B45309" },
  { id: "f6", name: "Oskar Lindqvist", role: "Audio engineer", rate: "$55/hr", rating: 5.0, reviews: 43, skills: ["Mixing", "Mastering"], available: false, color: "#6D28D9" },
];

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function GigCard({ gig, onOpen, justPosted }) {
  const color = CATEGORY_COLOR[gig.category];
  return (
    <button className="gig-card" onClick={() => onOpen(gig)} aria-label={`View details for ${gig.title}`}>
      <div className="gig-card-top">
        <span className="badge" style={{ color, background: `${color}14` }}>{gig.category}</span>
        {justPosted && <span className="badge-new">New</span>}
      </div>
      <h3 className="gig-title">{gig.title}</h3>
      <p className="gig-desc">{gig.desc}</p>
      <div className="gig-tags">
        {gig.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
      </div>
      <div className="gig-foot">
        <div>
          <div className="gig-budget">{gig.budget}</div>
          <div className="gig-type">{gig.type}</div>
        </div>
        <div className="gig-posted"><Clock size={12} /> {gig.posted}</div>
      </div>
    </button>
  );
}

function FreelancerCard({ f, onOpen }) {
  return (
    <button className="freelancer-card" onClick={() => onOpen(f)} aria-label={`View profile for ${f.name}`}>
      <div className="freelancer-top">
        <div className="avatar" style={{ background: f.color }}>{initials(f.name)}</div>
        <span className={`avail-tag ${f.available ? "avail-yes" : "avail-no"}`}>
          {f.available ? "Available" : "Booked"}
        </span>
      </div>
      <div className="freelancer-name">{f.name}</div>
      <div className="freelancer-role">{f.role}</div>
      <div className="freelancer-meta">
        <span className="rate">{f.rate}</span>
        <span className="rating"><Star size={12} fill="#B45309" stroke="#B45309" /> {f.rating.toFixed(1)} <span className="reviews">({f.reviews})</span></span>
      </div>
      <div className="freelancer-skills">
        {f.skills.map((s) => <span className="chip chip-light" key={s}>{s}</span>)}
      </div>
    </button>
  );
}

export default function FreelanceBoard() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [gigs, setGigs] = useState(INITIAL_GIGS);
  const [gigsLoading, setGigsLoading] = useState(true);
  const [gigsError, setGigsError] = useState("");
  const [freelancers, setFreelancers] = useState(FREELANCERS);
  const [newIds, setNewIds] = useState([]);
  const [selectedGig, setSelectedGig] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ title: "", category: "Design", budget: "", type: "Fixed price", desc: "" });
  const [formError, setFormError] = useState("");
  const [proposalSent, setProposalSent] = useState({});
  const [proposalBusyId, setProposalBusyId] = useState(null);
  const toastTimer = useRef(null);

  // --- Auth ---
  const [user, setUser] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [authModal, setAuthModal] = useState(null); // null | "login" | "signup"
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // --- "Create a freelancer profile" flow, triggered when a proposal needs one ---
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({ role: "", rateAmount: "", skills: "" });
  const [profileError, setProfileError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [pendingProposalGigId, setPendingProposalGigId] = useState(null);

  // --- Message-a-freelancer draft ---
  const [messageDraft, setMessageDraft] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function fireToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  // Load the logged-in user (if any) once, on mount.
  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me", { auth: true })
      .then(({ user, freelancerProfile }) => {
        setUser(user);
        setFreelancerProfile(freelancerProfile || null);
      })
      .catch(() => setStoredToken(null)); // stale/expired token
  }, []);

  // Load freelancers once, on mount.
  useEffect(() => {
    api("/freelancers?limit=100")
      .then(({ data }) => setFreelancers(data))
      .catch(() => {}); // keep the offline fallback list on failure
  }, []);

  // Load gigs from the API, refetching whenever the category or search
  // query changes (debounced so we don't hit the API on every keystroke).
  useEffect(() => {
    const t = setTimeout(() => {
      setGigsLoading(true);
      setGigsError("");
      const params = new URLSearchParams({ limit: "100" });
      if (category !== "All") params.set("category", category);
      if (query.trim()) params.set("q", query.trim());

      api(`/gigs?${params.toString()}`)
        .then(({ data }) => setGigs(data))
        .catch((err) => setGigsError(err.message))
        .finally(() => setGigsLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [category, query]);

  // filteredGigs is now just `gigs` — filtering happens server-side above.
  // Kept as its own name so the JSX below (and the empty-state check) reads the same.
  const filteredGigs = gigs;

  async function handlePostSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.budget.trim() || !form.desc.trim()) {
      setFormError("Fill in a title, budget, and description before posting.");
      return;
    }
    if (!user) {
      setFormError("Log in to post a job.");
      setShowPostForm(false);
      setAuthModal("login");
      return;
    }
    const amount = Number(form.budget.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Budget should be a number, e.g. 1500 or 45.");
      return;
    }

    try {
      const { data: newGig } = await api("/gigs", {
        method: "POST",
        auth: true,
        body: { title: form.title.trim(), category: form.category, budgetAmount: amount, type: form.type, desc: form.desc.trim(), tags: [] },
      });
      setGigs((g) => [newGig, ...g]);
      setNewIds((ids) => [newGig.id, ...ids]);
      setForm({ title: "", category: "Design", budget: "", type: "Fixed price", desc: "" });
      setFormError("");
      setShowPostForm(false);
      fireToast("Job posted successfully.");
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function sendProposal(gigId) {
    if (!user) {
      setAuthModal("login");
      return;
    }
    setProposalBusyId(gigId);
    try {
      await api(`/gigs/${gigId}/proposals`, { method: "POST", auth: true, body: {} });
      setProposalSent((p) => ({ ...p, [gigId]: true }));
      fireToast("Proposal sent.");
    } catch (err) {
      if (err.message.toLowerCase().includes("freelancer profile")) {
        setPendingProposalGigId(gigId);
        setProfileError("");
        setShowProfileForm(true);
      } else {
        fireToast(err.message);
      }
    } finally {
      setProposalBusyId(null);
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    if (!authForm.email.trim() || !authForm.password.trim() || (authModal === "signup" && !authForm.name.trim())) {
      setAuthError("Fill in all fields to continue.");
      return;
    }
    setAuthBusy(true);
    try {
      const path = authModal === "signup" ? "/auth/register" : "/auth/login";
      const body =
        authModal === "signup"
          ? { name: authForm.name.trim(), email: authForm.email.trim(), password: authForm.password, role: authForm.role }
          : { email: authForm.email.trim(), password: authForm.password };
      const { token, user: loggedInUser } = await api(path, { method: "POST", body });
      setStoredToken(token);
      setUser(loggedInUser);
      setAuthModal(null);
      setAuthForm({ name: "", email: "", password: "", role: "client" });
      fireToast(authModal === "signup" ? `Welcome, ${loggedInUser.name.split(" ")[0]}.` : `Welcome back, ${loggedInUser.name.split(" ")[0]}.`);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    setStoredToken(null);
    setUser(null);
    setFreelancerProfile(null);
    fireToast("Logged out.");
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    if (!profileForm.role.trim() || !profileForm.rateAmount.trim()) {
      setProfileError("Add a title and an hourly rate to continue.");
      return;
    }
    const amount = Number(profileForm.rateAmount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setProfileError("Rate should be a number, e.g. 65.");
      return;
    }
    setProfileBusy(true);
    try {
      const skills = profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const { data: profile } = await api("/freelancers", {
        method: "POST",
        auth: true,
        body: { role: profileForm.role.trim(), rateAmount: amount, skills, available: true },
      });
      setFreelancerProfile(profile);
      setShowProfileForm(false);
      setProfileForm({ role: "", rateAmount: "", skills: "" });
      fireToast("Freelancer profile created.");

      if (pendingProposalGigId) {
        const gigId = pendingProposalGigId;
        setPendingProposalGigId(null);
        await sendProposal(gigId);
      }
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleSendMessage(freelancer) {
    if (!user) {
      setAuthModal("login");
      return;
    }
    const body = messageDraft.trim() || `Hi ${freelancer.name.split(" ")[0]}, I'd like to talk about a project.`;
    setMessageBusy(true);
    try {
      await api("/messages", { method: "POST", auth: true, body: { recipientId: freelancer.userId, body } });
      fireToast(`Message sent to ${freelancer.name.split(" ")[0]}.`);
      setMessageDraft("");
      setSelectedFreelancer(null);
    } catch (err) {
      fireToast(err.message);
    } finally {
      setMessageBusy(false);
    }
  }

  return (
    <div className="board-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

        .board-app {
          --ink: #0F172A;
          --text-secondary: #5B6472;
          --text-muted: #8A93A3;
          --bg: #FFFFFF;
          --bg-subtle: #F7F8FA;
          --border: #E4E7EC;
          --border-strong: #CBD2DC;
          --accent: #0F5C4E;
          --accent-hover: #0B4A3F;
          --accent-soft: #E7F2EF;
          font-family: 'Inter', sans-serif;
          background: var(--bg-subtle);
          color: var(--ink);
          border-radius: 12px;
          overflow: hidden;
          line-height: 1.5;
        }
        .board-app * { box-sizing: border-box; }
        .board-app button { font-family: inherit; cursor: pointer; }
        .board-app :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 32px; background: var(--bg); border-bottom: 1px solid var(--border);
        }
        .brand { display: flex; align-items: center; gap: 9px; font-weight: 800; font-size: 18px; letter-spacing: -0.01em; color: var(--ink); }
        .brand-mark { width: 26px; height: 26px; border-radius: 6px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #fff; }
        .nav-links { display: flex; gap: 28px; font-size: 14px; font-weight: 500; color: var(--text-secondary); }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .nav-cta {
          background: var(--accent); color: #fff; border: none; font-weight: 600;
          font-size: 14px; padding: 10px 18px; border-radius: 7px; transition: background 0.15s ease;
        }
        .nav-cta:hover { background: var(--accent-hover); }
        .nav-user { font-size: 13.5px; font-weight: 600; color: var(--text-secondary); }
        .btn-icon {
          display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid var(--border-strong);
          color: var(--ink); font-weight: 600; font-size: 13.5px; padding: 8px 13px; border-radius: 7px; transition: background 0.15s ease;
        }
        .btn-icon:hover { background: var(--bg-subtle); }
        .form-tabs { display: flex; gap: 6px; background: var(--bg-subtle); padding: 4px; border-radius: 8px; margin-bottom: 18px; }
        .form-tab { flex: 1; background: transparent; border: none; padding: 8px; border-radius: 6px; font-weight: 600; font-size: 13.5px; color: var(--text-secondary); }
        .form-tab.active { background: var(--bg); color: var(--ink); box-shadow: 0 1px 3px rgba(15,23,42,0.08); }
        .error-state { display: flex; align-items: center; justify-content: center; gap: 6px; color: #B91C1C; }
        .spin { animation: fw-spin 0.8s linear infinite; }
        @keyframes fw-spin { to { transform: rotate(360deg); } }

        .hero {
          padding: 64px 32px 48px; text-align: center; background: var(--bg); border-bottom: 1px solid var(--border);
        }
        .hero-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--accent); background: var(--accent-soft); padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
        .hero h1 { font-weight: 800; font-size: clamp(32px, 4.5vw, 48px); line-height: 1.1; margin: 0 0 16px; letter-spacing: -0.025em; color: var(--ink); }
        .hero h1 span { color: var(--accent); }
        .hero p { max-width: 520px; margin: 0 auto 30px; color: var(--text-secondary); font-size: 16px; }
        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary {
          background: var(--accent); color: #fff; border: none; font-weight: 600; font-size: 15px;
          padding: 13px 22px; border-radius: 8px; display: inline-flex; align-items: center; gap: 7px;
          transition: background 0.15s ease;
        }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-secondary {
          background: var(--bg); color: var(--ink); border: 1px solid var(--border-strong); font-weight: 600; font-size: 15px;
          padding: 13px 22px; border-radius: 8px; transition: background 0.15s ease, border-color 0.15s ease;
        }
        .btn-secondary:hover { background: var(--bg-subtle); border-color: var(--text-muted); }

        .stats { display: flex; justify-content: center; gap: 0; flex-wrap: wrap; padding: 28px 32px; background: var(--bg); border-bottom: 1px solid var(--border); }
        .stat { padding: 0 36px; text-align: center; border-left: 1px solid var(--border); }
        .stat:first-child { border-left: none; }
        .stat-num { font-weight: 800; font-size: 26px; color: var(--ink); }
        .stat-label { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

        .board-section { padding: 48px 32px 56px; }
        .section-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; max-width: 1180px; margin-left: auto; margin-right: auto; }
        .section-title { font-weight: 700; font-size: 24px; margin: 0; letter-spacing: -0.02em; }
        .section-sub { color: var(--text-secondary); font-size: 14.5px; margin: 4px 0 0; }

        .controls { max-width: 1180px; margin: 0 auto 24px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .search-box { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 8px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 11px 14px; }
        .search-box input { background: transparent; border: none; color: var(--ink); font-size: 14px; width: 100%; outline: none; font-family: 'Inter', sans-serif; }
        .search-box input::placeholder { color: var(--text-muted); }
        .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .tab {
          font-size: 13.5px; font-weight: 500; padding: 9px 15px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--bg); color: var(--text-secondary);
          transition: all 0.15s ease;
        }
        .tab:hover { border-color: var(--border-strong); color: var(--ink); }
        .tab.active { background: var(--ink); border-color: var(--ink); color: #fff; font-weight: 600; }

        .board-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
        .empty-state { max-width: 1180px; margin: 40px auto; text-align: center; color: var(--text-muted); font-size: 14px; }

        .gig-card {
          position: relative; text-align: left; background: var(--bg); color: var(--ink);
          border: 1px solid var(--border); border-radius: 12px; padding: 22px; cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          display: flex; flex-direction: column;
        }
        .gig-card:hover, .gig-card:focus-visible { border-color: var(--border-strong); box-shadow: 0 4px 16px rgba(15,23,42,0.06); transform: translateY(-2px); }
        .gig-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
        .badge-new { font-size: 11px; font-weight: 700; color: #B45309; background: #FEF3E2; padding: 4px 9px; border-radius: 6px; letter-spacing: 0.02em; }
        .gig-title { font-weight: 700; font-size: 16.5px; line-height: 1.3; margin: 0 0 8px; letter-spacing: -0.01em; }
        .gig-desc { font-size: 13.5px; color: var(--text-secondary); margin: 0 0 14px; flex-grow: 1; }
        .gig-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .chip { font-size: 12px; background: var(--bg-subtle); border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; color: var(--text-secondary); }
        .chip-light { background: transparent; border: 1px solid var(--border); }
        .gig-foot { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 14px; }
        .gig-budget { font-weight: 700; font-size: 16px; }
        .gig-type { font-size: 12px; color: var(--text-muted); }
        .gig-posted { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }

        .freelancer-section { padding: 52px 32px; background: var(--bg); border-top: 1px solid var(--border); }
        .freelancer-row { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .freelancer-card {
          background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px;
          text-align: left; color: var(--ink); transition: border-color 0.15s ease, box-shadow 0.15s ease; display: flex; flex-direction: column; gap: 8px;
        }
        .freelancer-card:hover { border-color: var(--border-strong); box-shadow: 0 4px 16px rgba(15,23,42,0.06); }
        .freelancer-top { display: flex; align-items: center; justify-content: space-between; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; }
        .freelancer-name { font-weight: 700; font-size: 15.5px; margin-top: 2px; }
        .freelancer-role { font-size: 12.5px; color: var(--text-secondary); margin-top: -4px; }
        .freelancer-meta { display: flex; align-items: center; justify-content: space-between; font-size: 13px; margin-top: 4px; }
        .rate { font-weight: 700; }
        .rating { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); }
        .reviews { color: var(--text-muted); }
        .freelancer-skills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
        .avail-tag { font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: 6px; }
        .avail-yes { background: #E7F2EF; color: var(--accent); }
        .avail-no { background: var(--bg-subtle); color: var(--text-muted); }

        .how-section { padding: 52px 32px; background: var(--bg-subtle); border-top: 1px solid var(--border); }
        .how-row { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
        .how-card { text-align: left; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 22px; }
        .how-num { display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; background: var(--accent-soft); color: var(--accent); border-radius: 50%; width: 30px; height: 30px; margin-bottom: 14px; }
        .how-title { font-weight: 700; font-size: 16px; margin: 0 0 6px; letter-spacing: -0.01em; }
        .how-desc { font-size: 13.5px; color: var(--text-secondary); margin: 0; }

        .cta-banner { margin: 0 32px 52px; padding: 44px 36px; border-radius: 16px; background: var(--ink); text-align: center; }
        .cta-banner h2 { font-size: 26px; font-weight: 700; margin: 0 0 10px; color: #fff; letter-spacing: -0.02em; }
        .cta-banner p { color: #A3ACBA; margin: 0 0 22px; font-size: 14.5px; }
        .cta-banner .btn-primary { background: #fff; color: var(--ink); }
        .cta-banner .btn-primary:hover { background: #E9EBEF; }

        .footer { padding: 24px 32px; background: var(--bg); border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .footer-text { font-size: 13px; color: var(--text-muted); }
        .footer-links { display: flex; gap: 20px; font-size: 13px; color: var(--text-secondary); }

        .overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 50; }
        .modal { background: var(--bg); color: var(--ink); border-radius: 14px; max-width: 480px; width: 100%; max-height: 86vh; overflow-y: auto; padding: 32px; position: relative; box-shadow: 0 20px 60px rgba(15,23,42,0.25); }
        .modal-close { position: absolute; top: 18px; right: 18px; background: var(--bg-subtle); border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: var(--ink); }
        .modal-close:hover { background: var(--border); }
        .modal h2 { font-weight: 700; font-size: 22px; margin: 10px 0 14px; letter-spacing: -0.02em; }
        .modal-desc { font-size: 14.5px; color: var(--text-secondary); margin-bottom: 18px; }
        .modal-meta-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 16px 0; margin-bottom: 22px; }
        .modal-budget { font-weight: 800; font-size: 22px; }
        .modal-form label { display: block; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); }
        .modal-form input, .modal-form select, .modal-form textarea {
          width: 100%; border: 1px solid var(--border); background: var(--bg); border-radius: 8px; padding: 10px 12px; font-family: 'Inter', sans-serif; font-size: 14px; margin-bottom: 14px; color: var(--ink);
        }
        .modal-form input:focus, .modal-form select:focus, .modal-form textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .modal-form textarea { resize: vertical; min-height: 80px; }
        .form-error { color: #B91C1C; font-size: 13px; margin: -6px 0 14px; font-weight: 500; }
        .form-row { display: flex; gap: 12px; }
        .form-row > div { flex: 1; }
        .btn-submit { width: 100%; background: var(--accent); color: #fff; border: none; padding: 13px; border-radius: 8px; font-weight: 600; font-size: 14.5px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-submit:hover { background: var(--accent-hover); }
        .sent-btn { background: #E7F2EF; color: var(--accent); }
        .sent-btn:hover { background: #E7F2EF; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); z-index: 60; font-weight: 500; }

        @media (max-width: 640px) {
          .nav { padding: 14px 16px; }
          .nav-links { display: none; }
          .hero { padding: 44px 16px 36px; }
          .board-section, .freelancer-section, .how-section { padding-left: 16px; padding-right: 16px; }
          .cta-banner { margin: 0 16px 40px; padding: 32px 20px; }
          .footer { padding: 20px 16px; }
          .stats { padding: 22px 16px; }
          .stat { padding: 0 18px; }
        }
      `}</style>

      <nav className="nav">
        <div className="brand"><span className="brand-mark"><Briefcase size={14} /></span> Fieldwork</div>
        <div className="nav-links">
          <span>Browse jobs</span>
          <span>Find talent</span>
          <span>How it works</span>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
              <button className="btn-icon" onClick={handleLogout} aria-label="Log out"><LogOut size={15} /></button>
            </>
          ) : (
            <button className="btn-icon" onClick={() => { setAuthModal("login"); setAuthError(""); }}>
              <LogIn size={14} /> Log in
            </button>
          )}
          <button className="nav-cta" onClick={() => setShowPostForm(true)}>Post a job</button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-badge"><ShieldCheck size={14} /> Vetted freelancers, verified payments</div>
        <h1>Hire top freelance talent, <span>without the noise</span></h1>
        <p>Post a job in minutes or browse who's available right now. Direct proposals, transparent pricing, no bidding wars.</p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => setShowPostForm(true)}>Post a job <ArrowRight size={16} /></button>
          <button className="btn-secondary" onClick={() => document.getElementById("board-anchor")?.scrollIntoView({ behavior: "smooth" })}>Browse jobs</button>
        </div>
      </header>

      <div className="stats">
        <div className="stat"><div className="stat-num">{gigs.length}</div><div className="stat-label">Open jobs</div></div>
        <div className="stat"><div className="stat-num">{freelancers.length}</div><div className="stat-label">Freelancers available</div></div>
        <div className="stat"><div className="stat-num">6</div><div className="stat-label">Categories</div></div>
        <div className="stat"><div className="stat-num">24h</div><div className="stat-label">Avg. first reply</div></div>
      </div>

      <section className="board-section" id="board-anchor">
        <div className="section-head">
          <div>
            <h2 className="section-title">Open jobs</h2>
            <p className="section-sub">Every job live right now, updated as they're posted.</p>
          </div>
        </div>
        <div className="controls">
          <div className="search-box">
            <Search size={15} color="#8A93A3" />
            <input
              type="text"
              placeholder="Search by title or skill"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search jobs"
            />
          </div>
          <div className="tabs" role="tablist" aria-label="Filter by category">
            <button className={`tab ${category === "All" ? "active" : ""}`} onClick={() => setCategory("All")}>All</button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`tab ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {gigsError ? (
          <div className="empty-state error-state"><AlertCircle size={15} /> {gigsError}</div>
        ) : gigsLoading && filteredGigs.length === 0 ? (
          <div className="empty-state"><Loader2 size={15} className="spin" /> Loading jobs…</div>
        ) : filteredGigs.length === 0 ? (
          <div className="empty-state">No jobs match that search. Try another skill or clear the filter.</div>
        ) : (
          <div className="board-grid">
            {filteredGigs.map((g) => (
              <GigCard key={g.id} gig={g} onOpen={setSelectedGig} justPosted={newIds.includes(g.id)} />
            ))}
          </div>
        )}
      </section>

      <section className="freelancer-section">
        <div className="section-head" style={{ maxWidth: 1180, margin: "0 auto 24px" }}>
          <div>
            <h2 className="section-title">Available now</h2>
            <p className="section-sub">Freelancers with a track record in these categories.</p>
          </div>
        </div>
        <div className="freelancer-row">
          {freelancers.map((f) => <FreelancerCard key={f.id} f={f} onOpen={setSelectedFreelancer} />)}
        </div>
      </section>

      <section className="how-section">
        <div className="how-row">
          <div className="how-card">
            <div className="how-num">1</div>
            <h3 className="how-title">Post your job</h3>
            <p className="how-desc">Describe what you need and set a budget. It's visible to freelancers within seconds.</p>
          </div>
          <div className="how-card">
            <div className="how-num">2</div>
            <h3 className="how-title">Review proposals</h3>
            <p className="how-desc">Freelancers reply directly with rate, timeline, and relevant work. No auto-matching.</p>
          </div>
          <div className="how-card">
            <div className="how-num">3</div>
            <h3 className="how-title">Start the work</h3>
            <p className="how-desc">Choose who fits, agree on scope, and get going. The listing closes once it's filled.</p>
          </div>
        </div>
      </section>

      <div className="cta-banner">
        <h2>Have a project that needs doing?</h2>
        <p>Post it now — most jobs get a first reply within a day.</p>
        <button className="btn-primary" onClick={() => setShowPostForm(true)}>Post a job <ArrowRight size={16} /></button>
      </div>

      <footer className="footer">
        <span className="footer-text">Fieldwork — a freelance marketplace</span>
        <div className="footer-links">
          <span>About</span>
          <span>Trust and safety</span>
          <span>Support</span>
        </div>
      </footer>

      {selectedGig && (
        <div className="overlay" onClick={() => setSelectedGig(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedGig(null)} aria-label="Close"><X size={16} /></button>
            <span className="badge" style={{ color: CATEGORY_COLOR[selectedGig.category], background: `${CATEGORY_COLOR[selectedGig.category]}14` }}>{selectedGig.category}</span>
            <h2>{selectedGig.title}</h2>
            <p className="modal-desc">{selectedGig.desc}</p>
            {selectedGig.tags.length > 0 && (
              <div className="gig-tags" style={{ marginBottom: 4 }}>
                {selectedGig.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
              </div>
            )}
            <div className="modal-meta-row">
              <span className="modal-budget">{selectedGig.budget}</span>
              <span className="gig-type">{selectedGig.type} · Remote · {selectedGig.posted}</span>
            </div>
            <button
              className={`btn-submit ${proposalSent[selectedGig.id] ? "sent-btn" : ""}`}
              onClick={() => sendProposal(selectedGig.id)}
              disabled={!!proposalSent[selectedGig.id] || proposalBusyId === selectedGig.id}
            >
              {proposalSent[selectedGig.id] ? (
                <>Proposal sent <Check size={16} /></>
              ) : proposalBusyId === selectedGig.id ? (
                <>Sending… <Loader2 size={15} className="spin" /></>
              ) : (
                <>Send proposal <Send size={15} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {selectedFreelancer && (
        <div className="overlay" onClick={() => { setSelectedFreelancer(null); setMessageDraft(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setSelectedFreelancer(null); setMessageDraft(""); }} aria-label="Close"><X size={16} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, marginTop: 4 }}>
              <div className="avatar" style={{ background: selectedFreelancer.color, width: 52, height: 52, fontSize: 18 }}>{initials(selectedFreelancer.name)}</div>
              <div>
                <h2 style={{ margin: 0 }}>{selectedFreelancer.name}</h2>
                <div className="gig-type" style={{ marginTop: 2 }}>{selectedFreelancer.role}</div>
              </div>
            </div>
            <div className="modal-meta-row">
              <span className="modal-budget">{selectedFreelancer.rate}</span>
              <span className="rating">
                <Star size={13} fill="#B45309" stroke="#B45309" /> {selectedFreelancer.rating.toFixed(1)} <span className="reviews">({selectedFreelancer.reviews} reviews)</span>
              </span>
            </div>
            <div className="gig-tags" style={{ marginBottom: 22 }}>
              {selectedFreelancer.skills.map((s) => <span className="chip" key={s}>{s}</span>)}
            </div>
            <label htmlFor="message-draft">Message</label>
            <textarea
              id="message-draft"
              placeholder={`Hi ${selectedFreelancer.name.split(" ")[0]}, I'd like to talk about a project.`}
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              style={{ marginBottom: 14 }}
            />
            <button className="btn-submit" onClick={() => handleSendMessage(selectedFreelancer)} disabled={messageBusy}>
              {messageBusy ? <>Sending… <Loader2 size={15} className="spin" /></> : <>Message {selectedFreelancer.name.split(" ")[0]} <Send size={15} /></>}
            </button>
          </div>
        </div>
      )}

      {authModal && (
        <div className="overlay" onClick={() => setAuthModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthModal(null)} aria-label="Close"><X size={16} /></button>
            <span className="badge" style={{ color: "#B45309", background: "#FEF3E2" }}>{authModal === "signup" ? "Create account" : "Welcome back"}</span>
            <h2>{authModal === "signup" ? "Sign up" : "Log in"}</h2>
            <div className="form-tabs">
              <button type="button" className={`form-tab ${authModal === "login" ? "active" : ""}`} onClick={() => { setAuthModal("login"); setAuthError(""); }}>Log in</button>
              <button type="button" className={`form-tab ${authModal === "signup" ? "active" : ""}`} onClick={() => { setAuthModal("signup"); setAuthError(""); }}>Sign up</button>
            </div>
            <form className="modal-form" onSubmit={handleAuthSubmit}>
              {authModal === "signup" && (
                <>
                  <label htmlFor="auth-name">Name</label>
                  <input id="auth-name" type="text" placeholder="Your name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
                </>
              )}
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" placeholder="you@example.com" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" placeholder={authModal === "signup" ? "At least 8 characters" : "Your password"} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
              {authModal === "signup" && (
                <>
                  <label htmlFor="auth-role">I'm mainly here to</label>
                  <select id="auth-role" value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                    <option value="client">Post jobs</option>
                    <option value="freelancer">Find work</option>
                  </select>
                </>
              )}
              {authError && <div className="form-error">{authError}</div>}
              <button type="submit" className="btn-submit" disabled={authBusy}>
                {authBusy ? <>Please wait… <Loader2 size={15} className="spin" /></> : <>{authModal === "signup" ? "Create account" : "Log in"} <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {showProfileForm && (
        <div className="overlay" onClick={() => { setShowProfileForm(false); setPendingProposalGigId(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowProfileForm(false); setPendingProposalGigId(null); }} aria-label="Close"><X size={16} /></button>
            <span className="badge" style={{ color: "#B45309", background: "#FEF3E2" }}>One quick step</span>
            <h2>Set up your freelancer profile</h2>
            <p className="modal-desc">Clients see this when you send a proposal. You can edit it any time.</p>
            <form className="modal-form" onSubmit={handleProfileSubmit}>
              <label htmlFor="profile-role">Title</label>
              <input id="profile-role" type="text" placeholder="e.g. Full-stack developer" value={profileForm.role} onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })} />
              <label htmlFor="profile-rate">Hourly rate</label>
              <input id="profile-rate" type="text" placeholder="e.g. 65" value={profileForm.rateAmount} onChange={(e) => setProfileForm({ ...profileForm, rateAmount: e.target.value })} />
              <label htmlFor="profile-skills">Skills (comma separated)</label>
              <input id="profile-skills" type="text" placeholder="e.g. React, Node, Postgres" value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} />
              {profileError && <div className="form-error">{profileError}</div>}
              <button type="submit" className="btn-submit" disabled={profileBusy}>
                {profileBusy ? <>Saving… <Loader2 size={15} className="spin" /></> : <>Save profile <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPostForm && (
        <div className="overlay" onClick={() => setShowPostForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPostForm(false)} aria-label="Close"><X size={16} /></button>
            <span className="badge" style={{ color: "#B45309", background: "#FEF3E2" }}>New listing</span>
            <h2>Post a job</h2>
            <form className="modal-form" onSubmit={handlePostSubmit}>
              <label htmlFor="title">Title</label>
              <input id="title" type="text" placeholder="e.g. Logo refresh for a coffee roastery" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

              <div className="form-row">
                <div>
                  <label htmlFor="category">Category</label>
                  <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="type">Type</label>
                  <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option>Fixed price</option>
                    <option>Hourly</option>
                  </select>
                </div>
              </div>

              <label htmlFor="budget">Budget ({form.type === "Hourly" ? "per hour" : "total"})</label>
              <input id="budget" type="text" placeholder={form.type === "Hourly" ? "e.g. 50" : "e.g. 1500"} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />

              <label htmlFor="desc">Description</label>
              <textarea id="desc" placeholder="What needs doing, and by when?" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />

              {formError && <div className="form-error">{formError}</div>}

              <button type="submit" className="btn-submit">Post job <ArrowRight size={16} /></button>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast"><Check size={14} /> {toast}</div>}
    </div>
  );
}
