import { useState } from "react";
import { ExternalLink, Link2, ShieldCheck, X } from "lucide-react";
import { api, authLink } from "./api";

const accessLabels = { account: "Roblox profile", group: "Community", both: "Profile + Community" };

export default function RobloxAccess({ user, notify, onRefresh }) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [mode, setMode] = useState("account");
  const [groupId, setGroupId] = useState("");
  const connected = Boolean(user.robloxConnected && user.roblox);

  const startConnection = () => {
    const normalizedGroupId = groupId.trim();
    if ((mode === "group" || mode === "both") && (!/^\d+$/.test(normalizedGroupId) || normalizedGroupId === "0")) {
      return notify("Enter a valid Community ID before connecting Roblox.", "error");
    }
    const query = new URLSearchParams({ accessMode: mode, returnTo: "/publish" });
    if (mode !== "account") query.set("groupId", normalizedGroupId);
    window.location.href = `${authLink("roblox/connect")}?${query.toString()}`;
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect this Roblox account from ZaneXyuu Studio?")) return;
    try {
      await api("/api/auth/roblox", { method: "DELETE" });
      await onRefresh?.();
      notify("Roblox account disconnected.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <section className={`roblox-card ${connected ? "is-connected" : ""}`}>
      <div className="roblox-card-heading">
        <div className="roblox-heading-icon"><Link2 size={18} /></div>
        <div>
          <p className="eyebrow">ROBLOX CONNECTION</p>
          <h2>{connected ? "Publishing identity" : "Connect your Roblox account"}</h2>
        </div>
        <span className={`connection-state ${connected ? "is-connected" : ""}`}><i />{connected ? "Connected" : "Required"}</span>
      </div>

      {connected ? (
        <>
          <div className="roblox-profile">
            <span className="roblox-avatar">{user.roblox.avatar ? <img src={user.roblox.avatar} alt="" /> : "R"}</span>
            <span>
              <b>{user.roblox.displayName || user.roblox.username || "Roblox account"}</b>
              <small>@{user.roblox.username || user.roblox.userId} · Account ID {user.roblox.userId}</small>
            </span>
            <a href={user.roblox.profileUrl || `https://www.roblox.com/users/${user.roblox.userId}/profile`} target="_blank" rel="noreferrer" aria-label="Open Roblox profile"><ExternalLink size={14} /></a>
          </div>
          <div className="connected-access">
            <span>Connection scope</span>
            <b>{accessLabels[user.roblox.accessMode] || "Roblox profile"}{user.roblox.groupId ? ` · Community ${user.roblox.groupId}` : ""}</b>
          </div>
          <div className="roblox-modal-actions">
            <button type="button" className="button button-danger button-small" onClick={disconnect}>Disconnect Roblox</button>
          </div>
        </>
      ) : (
        <div className="roblox-connect-body">
          <p>Choose your Roblox profile or Community before OAuth connection. The selected scope will control which creator can publish.</p>
          <button type="button" className="button button-primary button-small" onClick={() => setChooserOpen(true)}><Link2 size={15} />Connect Roblox</button>
        </div>
      )}

      <div className="roblox-security"><ShieldCheck size={14} />Access scope is saved during Roblox authorization.</div>

      {chooserOpen && (
        <div className="roblox-modal-backdrop" role="presentation">
          <div className="roblox-modal" role="dialog" aria-modal="true" aria-labelledby="roblox-connect-title">
            <div className="roblox-modal-heading">
              <div><p className="eyebrow">ROBLOX AUTHORIZATION</p><h2 id="roblox-connect-title">Choose publishing scope</h2></div>
              <button type="button" className="icon-button" onClick={() => setChooserOpen(false)} aria-label="Close"><X size={17} /></button>
            </div>
            <p className="roblox-modal-copy">Select the identities this workspace may use when publishing assets.</p>
            <div className="scope-options">
              {[["account", "Roblox profile", "Publish to your personal profile."], ["group", "Community", "Publish to one Community."], ["both", "Profile + Community", "Allow both publishing targets."]].map(([value, label, copy]) => (
                <button type="button" className={`scope-option ${mode === value ? "is-active" : ""}`} key={value} onClick={() => setMode(value)}>
                  <span className="scope-radio" /><span><b>{label}</b><small>{copy}</small></span>
                </button>
              ))}
            </div>
            {(mode === "group" || mode === "both") && <label className="community-field">Community ID<input value={groupId} onChange={event => setGroupId(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="123456789" /></label>}
            <div className="roblox-modal-actions"><button type="button" className="button button-quiet button-small" onClick={() => setChooserOpen(false)}>Cancel</button><button type="button" className="button button-primary button-small" onClick={startConnection}><Link2 size={15} />Continue to Roblox</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
