"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layers3,
  ArrowRight,
  ShieldCheck,
  Users2,
  FileSpreadsheet,
  BarChart3,
  CheckCircle2,
  CopyX,
  Sparkles,
  HelpCircle,
  Play,
  TrendingUp,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  // Interactive demo preview state
  const [demoLeads, setDemoLeads] = useState([
    { id: "1", name: "Sarah Jenkins", company: "Acrobatics Corp", status: "Converted", email: "sarah@acrobatics.io" },
    { id: "2", name: "David Chen", company: "Apex Global", status: "Qualified", email: "david.c@apexglobal.com" },
    { id: "3", name: "Elena Rostova", company: "CyberVentures", status: "Contacted", email: "elena@cyberv.org" },
    { id: "4", name: "Michael Vance", company: "CloudScale Inc", status: "New", email: "m.vance@cloudscale.io" },
  ]);

  const cycleLeadStatus = (id: string) => {
    const statuses = ["New", "Contacted", "Qualified", "Converted", "Lost"];
    setDemoLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          const nextIndex = (statuses.indexOf(lead.status) + 1) % statuses.length;
          return { ...lead, status: statuses[nextIndex] };
        }
        return lead;
      })
    );
  };

  const convertedCount = demoLeads.filter((l) => l.status === "Converted").length;
  const demoConversionRate = Math.round((convertedCount / demoLeads.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Top Gradient Glow */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-transparent pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white shadow-lg shadow-teal-500/25 transition-transform group-hover:scale-105">
              <Layers3 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Lead<span className="text-teal-400">Flow</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="transition hover:text-teal-400">Features</a>
            <a href="#demo" className="transition hover:text-teal-400">Live Preview</a>
            <a href="#security" className="transition hover:text-teal-400">Enterprise Security</a>
            <a href="#pricing" className="transition hover:text-teal-400">Pricing</a>
            <a href="#faq" className="transition hover:text-teal-400">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-300 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Next-Gen Multi-Tenant Lead Intelligence Platform</span>
          </div>

          {/* Heading */}
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Turn Chaos into Closed Deals with{" "}
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              LeadFlow
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            Organize sales pipelines across isolated team workspaces. Eliminate duplicate outreach automatically, import thousands of contacts in seconds, and visualize revenue conversion funnels in real time.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-7 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-teal-500/25 transition hover:brightness-110 active:scale-95"
            >
              Start Free Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-base font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <Play className="h-4 w-4 text-teal-400" />
              Try Interactive Demo
            </a>
          </div>

          {/* Stats Badges */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto border-t border-slate-800/80 pt-8">
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">99.8%</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">Dedup Accuracy</p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">&lt; 1.5s</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">1000 Lead CSV Parse</p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">3 Roles</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">Owner, Admin, Member</p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">MongoDB Multi-Tenant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Preview Section */}
      <section id="demo" className="py-20 bg-slate-900/40 border-y border-slate-800/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Interactive Sandbox
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Experience the LeadFlow Interface
            </p>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Click on the status badges below to cycle lead stages and see conversion metrics react in real time.
            </p>
          </div>

          {/* App Preview Card */}
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Top Bar Window Chrome */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-500">app.leadflow.internal / workspace / enterprise-growth</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Sync Active
              </div>
            </div>

            {/* Dashboard Mock Controls */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Mini Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total Workspace Leads</span>
                    <Users2 className="h-4 w-4 text-teal-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{demoLeads.length}</p>
                  <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> +14% this week
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Live Conversion Rate</span>
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">{demoConversionRate}%</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {convertedCount} of {demoLeads.length} leads converted
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Deduplication Health</span>
                    <ShieldCheck className="h-4 w-4 text-teal-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-teal-300">Clean</p>
                  <p className="mt-1 text-xs text-slate-400">0 duplicate collisions</p>
                </div>
              </div>

              {/* Interactive Leads Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Lead Contact</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Status (Click to toggle)</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {demoLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 font-medium text-white">
                          <div>{lead.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{lead.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{lead.company}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => cycleLeadStatus(lead.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition hover:opacity-80 ${
                              lead.status === "Converted"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : lead.status === "Qualified"
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : lead.status === "Contacted"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : lead.status === "Lost"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {lead.status}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href="/dashboard/leads"
                            className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                          >
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Quick Callout */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-teal-500/10 border border-teal-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-teal-400 shrink-0" />
                  <p className="text-xs sm:text-sm text-teal-200">
                    Ready to load your real sales data? Sign in to unlock CSV bulk import and multi-workspace access.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="shrink-0 rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                >
                  Create Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            Engineered for Modern Sales Teams
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Everything You Need to Scale Pipeline
          </p>
          <p className="mt-3 text-slate-400 text-base">
            Eliminate silos, stop double-contacting leads, and empower your entire team with role-based access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <Layers3 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Multi-Tenant Workspaces</h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Segment pipelines by brand, territory, product, or enterprise unit. Each workspace maintains isolated leads, team members, and customizable color branding.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Independent workspace routing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Shared workspace invitations
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CopyX className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Automated Deduplication</h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Detect cross-lead duplicate conflicts instantly using email normalization and international phone matching. Inspect duplicate groups and merge or prune with one click.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> E.164 phone digit normalization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Zero redundant rep outreach
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">High-Speed CSV Pipeline</h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Upload spreadsheets with up to 1,000 leads in a single batch. Built-in PapaParse validation, row-by-row diagnostics, and spreadsheet formula injection protection.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> Bulk MongoDB upsert operations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" /> CSV sanitize &amp; formula defense
              </li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Users2 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Granular Role Permissions</h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Strict RBAC authorization. Workspace Owners manage settings and deletion, Admins manage leads and team members, and Members focus on lead qualification.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" /> Owner, Admin, Member roles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" /> Resend email token invites
              </li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Visual Revenue Analytics</h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Track conversion funnels, lead status breakdown, and lead source performance with interactive Recharts visualizations. Compare performance across all workspaces.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" /> 7d, 30d, 90d, 12m time ranges
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" /> One-click CSV analytics export
              </li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-slate-700 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Better Auth &amp; JWT Security</h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Backed by Better Auth with session cookies and JWT plugin verification. All routes enforce token checks, server-side data validation, and strict error masking.
            </p>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0" /> Bearer token &amp; cookie sessions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0" /> Protected Next.js layouts
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section id="security" className="py-20 bg-slate-900/30 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Enterprise Grade Foundation
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                Multi-Tenant Isolation &amp; Cryptographic Security
              </h2>
              <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
                LeadFlow is engineered from the ground up to keep your sales prospects and organizational boundaries secure. Every database query enforces user and workspace permissions at the database adapter layer.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/20 text-teal-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Better Auth JWT &amp; Session Tokens</h4>
                    <p className="text-xs text-slate-400">Dual session verification supports standard browser sessions and API Bearer tokens.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/20 text-teal-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Formula Injection Protection</h4>
                    <p className="text-xs text-slate-400">CSV exports sanitize malicious symbols (=, +, -, @) to prevent remote spreadsheet execution.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/20 text-teal-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Hierarchical RBAC Enforcement</h4>
                    <p className="text-xs text-slate-400">Strict permission matrix ensures Members cannot delete workspace assets or invite Admins.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code / Architecture Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-slate-500">
                <span>security-architecture.json</span>
                <span className="text-teal-400">AUDITED &amp; COMPLIANT</span>
              </div>
              <pre className="mt-4 text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "auth": {
    "engine": "Better Auth 1.7",
    "strategy": "Session Cookie + Bearer JWT",
    "passwordPolicy": "Minimum 8 characters"
  },
  "roles": {
    "Owner": ["workspace:*", "leads:*", "members:*"],
    "Admin": ["workspace:read", "leads:*", "members:invite"],
    "Member": ["workspace:read", "leads:read", "leads:create", "leads:update"]
  },
  "database": {
    "driver": "MongoDB 7.9 Native",
    "isolation": "Compound Index Scoping { userId, workspaceId }",
    "dedupEngine": "Normalized E.164 + Lowercase RFC5322"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Choose the Plan that Fits Your Growth
          </p>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Start free, upgrade as your team and pipeline expand. No hidden costs.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm ${billingCycle === "monthly" ? "text-white font-semibold" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-800 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-teal-400 shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === "annual" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === "annual" ? "text-white font-semibold" : "text-slate-400"}`}>
              Annual <span className="text-xs text-teal-400 font-bold">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Starter</h3>
              <p className="mt-1 text-xs text-slate-400">Ideal for solopreneurs &amp; freelance consultants.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-sm text-slate-400">/ forever free</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Up to 250 leads
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Personal lead management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> CSV import (up to 100/file)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Standard dashboard charts
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 block w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Tier 2 - Popular */}
          <div className="relative rounded-2xl border-2 border-teal-500 bg-slate-900 p-8 flex flex-col justify-between shadow-xl shadow-teal-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-xs font-bold text-slate-950 uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Professional</h3>
              <p className="mt-1 text-xs text-slate-400">For scaling sales teams &amp; agencies.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  ${billingCycle === "annual" ? "24" : "29"}
                </span>
                <span className="text-sm text-slate-400">/ user / mo</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Unlimited leads &amp; contacts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Unlimited team workspaces
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Automated duplicate detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> High-speed 1,000 lead CSV imports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Team roles &amp; email invites
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Cross-workspace comparison analytics
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 block w-full rounded-xl bg-teal-500 py-3 text-center text-sm font-bold text-slate-950 hover:bg-teal-400 transition shadow-lg shadow-teal-500/25"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Tier 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Enterprise</h3>
              <p className="mt-1 text-xs text-slate-400">For organizations with advanced security &amp; compliance needs.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  ${billingCycle === "annual" ? "79" : "99"}
                </span>
                <span className="text-sm text-slate-400">/ mo</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Everything in Professional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Dedicated database cluster option
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Custom API token integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" /> Priority 24/7 SLA support
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="mt-8 block w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-900/30 border-t border-slate-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Got Questions?
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                How does LeadFlow detect duplicate leads?
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                LeadFlow indexes your leads by normalized email address and normalized phone numbers (stripping formatting and special characters). When matches are found within a workspace or across your accessible database, they are grouped in the Duplicates center for review.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                What permissions do the different team roles have?
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                <strong>Owner:</strong> Full control over workspace settings, renaming, deletion, member invites, role updates, and lead CRUD.<br />
                <strong>Admin:</strong> Can create, view, edit, and delete leads, and invite new Members.<br />
                <strong>Member:</strong> Can read, create, and update leads within the assigned workspace.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                Can I import leads from any CSV file?
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Yes! LeadFlow supports flexible column naming (e.g. &apos;name&apos; or &apos;Full Name&apos;, &apos;email&apos; or &apos;Email Address&apos;). Built-in validation identifies missing or malformed records and protects against malicious spreadsheet formula injection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Conversion CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/80 via-slate-900 to-emerald-950/80 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Accelerate Your Revenue Pipeline Today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-300">
              Join sales teams who trust LeadFlow for clean, multi-tenant lead management and fast team collaboration.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-xl bg-teal-400 px-8 py-3.5 text-base font-bold text-slate-950 hover:bg-teal-300 transition shadow-lg shadow-teal-400/25"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-3.5 text-base font-medium text-slate-200 hover:bg-slate-800 transition"
              >
                Sign In to Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500 text-slate-950 font-bold">
              <Layers3 className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-300">LeadFlow SaaS</span>
            <span>&copy; {new Date().getFullYear()} LeadFlow Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-400 transition">Login</Link>
            <Link href="/register" className="hover:text-slate-400 transition">Register</Link>
            <a href="#features" className="hover:text-slate-400 transition">Features</a>
            <a href="#security" className="hover:text-slate-400 transition">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
