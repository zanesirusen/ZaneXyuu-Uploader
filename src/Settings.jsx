import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "./api";

const emptyForm = { label: "", apiKey: "", creatorType: "user", creatorId: "", expiresAt: "" };
const expiryDays = value => value ? Math.ceil((new Date(value).getTime() - Date.now()) / 86400000) : null;

export default function Settings({ user, notify }) {
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const loadCredentials = async () => {
    if (!user) return setCredentials([]);
    try { setCredentials((await api("/api/credentials")).credentials || []); }
    catch (error) { notify(error.message, "error"); }
  };
  useEffect(() => { loadCredentials(); }, [user]);

  const save = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await api("/api/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm(emptyForm);
      await loadCredentials();
      notify("API key saved securely.", "success");
    } catch (error) { notify(error.message, "error"); }
    finally { setLoading(false); }
  };
  const remove = async credentialId => {
    if (!window.confirm("Delete this saved API key?")) return;
    try { await api(`/api/credentials/${encodeURIComponent(credentialId)}`, { method: "DELETE" }); await loadCredentials(); notify("Saved API key deleted.", "success"); }
    catch (error) { notify(error.message, "error"); }
  };

  if (!user) return <div className="view-stack"><section className="page-title"><div><p className="eyebrow">SETTINGS</p><h1>Secure your workspace<span>.</span></h1><p className="lead">Sign in before saving Roblox API keys and publishing credentials.</p></div></section><section className="empty-panel"><ShieldCheck size={22} /><p>Sign in to manage saved credentials.</p></section></div>;
  return <div className="view-stack"><section className="page-title"><div><p className="eyebrow">SETTINGS</p><h1>Workspace settings<span>.</span></h1><p className="lead">Save encrypted Roblox API keys once and reuse them during publishing.</p></div></section><div className="settings-layout"><section className="workspace-panel settings-panel"><div className="panel-header"><div><p className="eyebrow">SAVED CREDENTIAL</p><h2>Add an API key</h2></div><KeyRound size={20} /></div><form className="settings-form" onSubmit={save}><label>Label<input required value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} placeholder="Production uploader" /></label><label>Roblox API key<input required type="password" value={form.apiKey} onChange={event => setForm({ ...form, apiKey: event.target.value })} placeholder="Paste your API key" autoComplete="new-password" /></label><div className="form-grid"><label>Creator type<select value={form.creatorType} onChange={event => setForm({ ...form, creatorType: event.target.value })}><option value="user">Profile</option><option value="group">Community</option></select></label><label>Creator ID<input inputMode="numeric" value={form.creatorId} onChange={event => setForm({ ...form, creatorId: event.target.value.replace(/\D/g, "") })} placeholder="Optional" /></label></div><label>Expires on <span className="field-hint">optional</span><input type="date" value={form.expiresAt} onChange={event => setForm({ ...form, expiresAt: event.target.value })} /></label><button className="button button-primary" disabled={loading}><Plus size={16} />{loading ? "Saving..." : "Save API key"}</button></form><div className="settings-security"><ShieldCheck size={16} /><span>Keys are encrypted server-side and never returned to this browser.</span></div></section><section className="section-block settings-list"><div className="section-heading"><div><p className="eyebrow">CREDENTIAL VAULT</p><h2>Saved API keys</h2></div><span className="status-label is-ready">{credentials.length} saved</span></div>{credentials.length ? credentials.map(credential => { const days = expiryDays(credential.expiresAt); const warning = !credential.expired && days !== null && days <= 7; return <div className={`credential-row ${credential.expired ? "is-expired" : ""}`} key={credential.credentialId}><span className="credential-icon">{credential.expired ? <AlertTriangle size={16} /> : warning ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}</span><span><b>{credential.label}</b><small>{credential.creatorType} {credential.creatorId || "· default creator"} · {credential.expired ? "Expired" : warning ? `Expires in ${Math.max(0, days)} day${days === 1 ? "" : "s"}` : credential.expiresAt ? `Expires ${new Date(credential.expiresAt).toLocaleDateString()}` : "No expiry set"} · {credential.lastUsedAt ? `Last used ${new Date(credential.lastUsedAt).toLocaleDateString()}` : "Not used yet"}</small></span><button type="button" className="icon-button" onClick={() => remove(credential.credentialId)} aria-label={`Delete ${credential.label}`}><Trash2 size={16} /></button></div>; }) : <div className="empty-panel"><KeyRound size={22} /><p>No saved API keys.</p><small>Add one to select it during publishing.</small></div>}</section></div></div>;
}
