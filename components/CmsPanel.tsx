"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Settings01Icon, AddSquareIcon, Edit02Icon, CheckmarkCircle02Icon,
  AlertCircleIcon, Loading03Icon, Cancel01Icon, Copy01Icon,
  Delete02Icon, ToggleOnIcon, ToggleOffIcon, CodeCircleIcon,
} from "hugeicons-react"
import { cn } from "@/lib/utils"

// The shape the project's /api/hub-cms endpoint should return
export interface CmsContent {
  textBlocks?: Record<string, string>       // key → value  e.g. { heroTitle: "Welcome" }
  featureFlags?: Record<string, boolean>    // key → on/off e.g. { newCheckout: true }
  settings?: Record<string, string | number | boolean>  // misc config
}

interface Props {
  projectUrl: string
  hubSecret?: string   // if empty, panel prompts the user for it
  projectName: string
  storageKey?: string  // if provided, secret is persisted to localStorage under this key
}

type Section = "content" | "flags" | "settings" | "snippet"

export function CmsPanel({ projectUrl, hubSecret: initialSecret, projectName, storageKey }: Props) {
  const [section, setSection] = useState<Section>("content")
  const [cms, setCms] = useState<CmsContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Resolve hub secret — prefer prop, fall back to localStorage
  const lsKey = storageKey ? `hub_cms_secret_${storageKey}` : null
  const storedSecret = lsKey && typeof window !== "undefined" ? localStorage.getItem(lsKey) ?? "" : ""
  const [hubSecret, setHubSecretState] = useState(initialSecret || storedSecret)
  const [secretInput, setSecretInput] = useState("")
  const [showSecret, setShowSecret] = useState(false)

  function generateSecret() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const arr = crypto.getRandomValues(new Uint8Array(32))
    setSecretInput(Array.from(arr).map(b => chars[b % chars.length]).join(""))
    setShowSecret(true)
  }

  function saveSecret() {
    if (!secretInput.trim()) return
    if (lsKey) localStorage.setItem(lsKey, secretInput.trim())
    setHubSecretState(secretInput.trim())
    setSecretInput("")
  }

  // Editing state — must be declared before any early return (Rules of Hooks)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [addingTo, setAddingTo] = useState<"textBlocks" | "featureFlags" | "settings" | null>(null)

  const fetchCms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUrl, hubSecret, action: "get" }),
      })
      const json = await res.json()
      if (json.ok && json.data) {
        setCms(json.data as CmsContent)
      } else {
        setError(json.data?.error || `Status ${json.status} — is /api/hub-cms set up?`)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [projectUrl, hubSecret])

  useEffect(() => {
    if (hubSecret && section !== "snippet") fetchCms()
  }, [hubSecret, section, fetchCms])

  if (!hubSecret) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">Enter Hub Secret</p>
        <p className="text-xs text-zinc-400">
          Set <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">HUB_SECRET</code> in your project env vars,
          then paste the same value here to unlock the CMS.
        </p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type={showSecret ? "text" : "password"}
              placeholder="your-hub-secret"
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveSecret()}
              className="flex-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <button onClick={() => setShowSecret(s => !s)}
              className="px-3 py-2 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
              {showSecret ? "Hide" : "Show"}
            </button>
            <button onClick={saveSecret} disabled={!secretInput.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40">
              Connect
            </button>
          </div>
          <button onClick={generateSecret}
            className="text-xs text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 underline">
            Generate a secret for me
          </button>
          {secretInput && showSecret && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-1">Copy this — add it as <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">HUB_SECRET</code> in your project env vars, then click Connect.</p>
              <p className="text-xs font-mono text-amber-800 dark:text-amber-300 break-all select-all">{secretInput}</p>
            </div>
          )}
        </div>
        <button onClick={() => setSection("snippet")} className="text-xs text-zinc-400 underline">
          See setup guide
        </button>
        {section === "snippet" && <SnippetSection projectName={projectName} />}
      </div>
    )
  }


  async function saveField(field: keyof CmsContent, key: string, value: unknown) {
    setSaving(key)
    setError(null)
    try {
      const updated = {
        ...cms,
        [field]: { ...(cms?.[field] as Record<string, unknown> || {}), [key]: value },
      }
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUrl, hubSecret, action: "save", payload: updated }),
      })
      const json = await res.json()
      if (json.ok) {
        setCms(updated as CmsContent)
        setLastSaved(key)
        setEditingKey(null)
        setAddingTo(null)
        setNewKey("")
        setNewValue("")
        setTimeout(() => setLastSaved(null), 2000)
      } else {
        setError(json.data?.error || "Save failed")
      }
    } finally {
      setSaving(null) }
  }

  async function deleteField(field: keyof CmsContent, key: string) {
    setSaving(key)
    try {
      const copy = { ...(cms?.[field] as Record<string, unknown> || {}) }
      delete copy[key]
      const updated = { ...cms, [field]: copy }
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUrl, hubSecret, action: "save", payload: updated }),
      })
      const json = await res.json()
      if (json.ok) setCms(updated as CmsContent)
    } finally { setSaving(null) }
  }

  const tabs: { id: Section; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "flags", label: "Feature Flags" },
    { id: "settings", label: "Settings" },
    { id: "snippet", label: "Setup" },
  ]

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              section === t.id
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {section === "snippet" ? (
        <SnippetSection projectName={projectName} />
      ) : loading ? (
        <div className="flex items-center gap-2 py-8 text-zinc-400 text-sm">
          <Loading03Icon size={16} className="animate-spin" /> Connecting to {projectName}...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4">
          <div className="flex items-start gap-2">
            <AlertCircleIcon size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Could not reach CMS</p>
              <p className="text-xs text-red-500">{error}</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={fetchCms} className="text-xs text-red-600 dark:text-red-400 underline">Retry</button>
                <span className="text-red-300">·</span>
                <button onClick={() => setSection("snippet")} className="text-xs text-red-600 dark:text-red-400 underline">See setup guide</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {section === "content" && (
            <CmsSection
              title="Text & Content Blocks"
              description="Edit any text on your site without touching code."
              field="textBlocks"
              data={cms?.textBlocks || {}}
              type="text"
              saving={saving}
              lastSaved={lastSaved}
              editingKey={editingKey}
              editValue={editValue}
              addingTo={addingTo}
              newKey={newKey}
              newValue={newValue}
              onEdit={(k, v) => { setEditingKey(k); setEditValue(v) }}
              onSave={(k, v) => saveField("textBlocks", k, v)}
              onDelete={(k) => deleteField("textBlocks", k)}
              onCancelEdit={() => setEditingKey(null)}
              setEditValue={setEditValue}
              onStartAdd={() => setAddingTo("textBlocks")}
              onCancelAdd={() => { setAddingTo(null); setNewKey(""); setNewValue("") }}
              onAddSave={() => newKey.trim() && saveField("textBlocks", newKey.trim(), newValue)}
              setNewKey={setNewKey}
              setNewValue={setNewValue}
            />
          )}

          {section === "flags" && (
            <FeatureFlagsSection
              flags={cms?.featureFlags || {}}
              saving={saving}
              lastSaved={lastSaved}
              addingTo={addingTo}
              newKey={newKey}
              newValue={newValue}
              onToggle={(k, v) => saveField("featureFlags", k, v)}
              onDelete={(k) => deleteField("featureFlags", k)}
              onStartAdd={() => setAddingTo("featureFlags")}
              onCancelAdd={() => { setAddingTo(null); setNewKey(""); setNewValue("") }}
              onAddSave={() => newKey.trim() && saveField("featureFlags", newKey.trim(), newValue === "true")}
              setNewKey={setNewKey}
              setNewValue={setNewValue}
            />
          )}

          {section === "settings" && (
            <CmsSection
              title="Settings & Config"
              description="Key-value config pushed to your project without a redeploy."
              field="settings"
              data={cms?.settings || {}}
              type="setting"
              saving={saving}
              lastSaved={lastSaved}
              editingKey={editingKey}
              editValue={editValue}
              addingTo={addingTo}
              newKey={newKey}
              newValue={newValue}
              onEdit={(k, v) => { setEditingKey(k); setEditValue(String(v)) }}
              onSave={(k, v) => saveField("settings", k, v)}
              onDelete={(k) => deleteField("settings", k)}
              onCancelEdit={() => setEditingKey(null)}
              setEditValue={setEditValue}
              onStartAdd={() => setAddingTo("settings")}
              onCancelAdd={() => { setAddingTo(null); setNewKey(""); setNewValue("") }}
              onAddSave={() => newKey.trim() && saveField("settings", newKey.trim(), newValue)}
              setNewKey={setNewKey}
              setNewValue={setNewValue}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── Reusable text/settings section ───────────────────────────────────────────

interface CmsSectionProps {
  title: string
  description: string
  field: keyof CmsContent
  data: Record<string, unknown>
  type: "text" | "setting"
  saving: string | null
  lastSaved: string | null
  editingKey: string | null
  editValue: string
  addingTo: string | null
  newKey: string
  newValue: string
  onEdit: (k: string, v: string) => void
  onSave: (k: string, v: string) => void
  onDelete: (k: string) => void
  onCancelEdit: () => void
  setEditValue: (v: string) => void
  onStartAdd: () => void
  onCancelAdd: () => void
  onAddSave: () => void
  setNewKey: (v: string) => void
  setNewValue: (v: string) => void
}

function CmsSection({
  title, description, field, data, type,
  saving, lastSaved, editingKey, editValue, addingTo, newKey, newValue,
  onEdit, onSave, onDelete, onCancelEdit, setEditValue,
  onStartAdd, onCancelAdd, onAddSave, setNewKey, setNewValue,
}: CmsSectionProps) {
  const entries = Object.entries(data)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
        </div>
        <button onClick={onStartAdd}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
          <AddSquareIcon size={12} /> Add
        </button>
      </div>

      {entries.length === 0 && addingTo !== field && (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="text-xs text-zinc-400">No {type === "text" ? "content blocks" : "settings"} yet.</p>
          <button onClick={onStartAdd} className="text-xs text-violet-500 underline mt-1">Add the first one</button>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(([key, val]) => {
          const isEditing = editingKey === key
          const isSaving = saving === key
          const saved = lastSaved === key
          return (
            <div key={key} className={cn(
              "rounded-xl border p-3 transition-colors",
              isEditing ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            )}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400">{key}</span>
                <div className="flex items-center gap-1">
                  {saved && <CheckmarkCircle02Icon size={12} className="text-emerald-500" />}
                  {!isEditing && (
                    <>
                      <button onClick={() => onEdit(key, String(val))}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                        <Edit02Icon size={11} />
                      </button>
                      <button onClick={() => onDelete(key)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500">
                        <Delete02Icon size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => onSave(key, editValue)} disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                      {isSaving ? <Loading03Icon size={11} className="animate-spin" /> : <CheckmarkCircle02Icon size={11} />}
                      Save
                    </button>
                    <button onClick={onCancelEdit} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">{String(val)}</p>
              )}
            </div>
          )
        })}

        {addingTo === field && (
          <div className="rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
            <input
              placeholder="key (e.g. heroTitle)"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <textarea
              placeholder="value"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="flex items-center gap-2">
              <button onClick={onAddSave} disabled={!newKey.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40">
                <AddSquareIcon size={11} /> Add
              </button>
              <button onClick={onCancelAdd} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Feature flags section ────────────────────────────────────────────────────

interface FeatureFlagsSectionProps {
  flags: Record<string, boolean>
  saving: string | null
  lastSaved: string | null
  addingTo: string | null
  newKey: string
  newValue: string
  onToggle: (k: string, v: boolean) => void
  onDelete: (k: string) => void
  onStartAdd: () => void
  onCancelAdd: () => void
  onAddSave: () => void
  setNewKey: (v: string) => void
  setNewValue: (v: string) => void
}

function FeatureFlagsSection({
  flags, saving, lastSaved, addingTo, newKey, newValue,
  onToggle, onDelete, onStartAdd, onCancelAdd, onAddSave, setNewKey, setNewValue,
}: FeatureFlagsSectionProps) {
  const entries = Object.entries(flags)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Feature Flags</p>
          <p className="text-xs text-zinc-400 mt-0.5">Toggle features on/off without a redeploy.</p>
        </div>
        <button onClick={onStartAdd}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
          <AddSquareIcon size={12} /> Add flag
        </button>
      </div>

      {entries.length === 0 && addingTo !== "featureFlags" && (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="text-xs text-zinc-400">No feature flags yet.</p>
          <button onClick={onStartAdd} className="text-xs text-violet-500 underline mt-1">Add one</button>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(([key, enabled]) => {
          const isSaving = saving === key
          const saved = lastSaved === key
          return (
            <div key={key} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-mono font-medium text-zinc-800 dark:text-zinc-200">{key}</span>
                <span className={cn("ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  enabled ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}>
                  {enabled ? "ON" : "OFF"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {saved && <CheckmarkCircle02Icon size={12} className="text-emerald-500" />}
                {isSaving ? (
                  <Loading03Icon size={16} className="animate-spin text-zinc-400" />
                ) : (
                  <button onClick={() => onToggle(key, !enabled)}
                    className={cn("transition-colors", enabled ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600")}>
                    {enabled ? <ToggleOnIcon size={24} /> : <ToggleOffIcon size={24} />}
                  </button>
                )}
                <button onClick={() => onDelete(key)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500">
                  <Delete02Icon size={11} />
                </button>
              </div>
            </div>
          )
        })}

        {addingTo === "featureFlags" && (
          <div className="rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
            <input
              placeholder="flag name (e.g. newCheckout)"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={newValue === "true"}
                  onChange={e => setNewValue(e.target.checked ? "true" : "false")}
                  className="rounded" />
                Start enabled
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onAddSave} disabled={!newKey.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40">
                <AddSquareIcon size={11} /> Add flag
              </button>
              <button onClick={onCancelAdd} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Setup snippet ────────────────────────────────────────────────────────────

function SnippetSection({ projectName }: { projectName: string }) {
  const [copied, setCopied] = useState(false)

  const snippet = `// app/api/hub-cms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const SECRET = process.env.HUB_SECRET ?? ""

declare global { var _pgPool: Pool | undefined }
function getPool() {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return global._pgPool
}

async function ensureTable() {
  await getPool().query(\`
    CREATE TABLE IF NOT EXISTS hub_cms (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'
    )
  \`)
}

async function getCms() {
  await ensureTable()
  const res = await getPool().query(
    "SELECT value FROM hub_cms WHERE key = 'main'"
  )
  return res.rows[0]?.value ?? {}
}

async function saveCms(data: unknown) {
  await ensureTable()
  await getPool().query(
    \`INSERT INTO hub_cms (key, value) VALUES ('main', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1\`,
    [JSON.stringify(data)]
  )
}

function auth(req: NextRequest) {
  return req.headers.get("x-hub-secret") === SECRET && SECRET !== ""
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getCms())
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await saveCms(await req.json())
  return NextResponse.json({ ok: true })
}`

  function copy() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CodeCircleIcon size={14} className="text-violet-500" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Add CMS to {projectName}</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Paste this route into your project. It stores CMS data in your Postgres database —
          the table is created automatically on first use. Works with Neon, Supabase, Railway, or any
          <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded mx-1">DATABASE_URL</code>-compatible DB.
        </p>

        <div className="relative rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500">app/api/hub-cms/route.ts</span>
            <button onClick={copy}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors">
              {copied ? <CheckmarkCircle02Icon size={11} className="text-emerald-500" /> : <Copy01Icon size={11} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-[11px] leading-relaxed text-zinc-300 p-4 overflow-x-auto font-mono whitespace-pre">
            {snippet}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Setup checklist</p>
        {[
          "Copy the route file above into your project at app/api/hub-cms/route.ts",
          "Make sure pg is installed — run: npm install pg @types/pg",
          "Confirm DATABASE_URL is already set in your Vercel env vars (it should be if your DB is connected)",
          "Add HUB_SECRET to your Vercel env vars — use the same value you entered above",
          "Deploy — the hub_cms table is created automatically on first request",
          "Come back and click Content, Feature Flags, or Settings to start editing",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-zinc-500">{i + 1}</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

