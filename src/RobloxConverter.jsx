import { useState } from "react";
import { AudioLines, Check, Download, FileAudio, Link2, Plus, RefreshCw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { apiUrl } from "./api";
import AdvancedConverter from "./AdvancedConverter";

export default function RobloxConverter({ notify }) {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const isValidUrl = value => { try { const parsed = new URL(value); return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname); } catch { return false; } };
  const urlReady = isValidUrl(url.trim());
  const loadPreview = async (nextUrl = url) => { const trimmed = String(nextUrl || "").trim(); if (!trimmed) return; if (!isValidUrl(trimmed)) { setPreview(null); notify("Paste a valid Spotify, YouTube, or SoundCloud URL.", "error"); return; } try { const response = await fetch(`${apiUrl("/api/preview")}?url=${encodeURIComponent(trimmed)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Preview could not be loaded."); setPreview(data); setResult(null); } catch (error) { setPreview(null); notify(error.message, "error"); } };
  const handleUrlInput = nextValue => {
    const trimmed = String(nextValue || "").trim();
    setUrl(trimmed);
    setPreview(null);
    if (trimmed && isValidUrl(trimmed)) {
      window.setTimeout(() => { setUrl(current => {
        const latest = String(current || "").trim();
        if (latest !== trimmed) return current;
        return current;
      }); loadPreview(trimmed); }, 80);
    }
  };
  const convert = async event => {
    event.preventDefault();
    if (mode === "studio") return;
    if (mode === "url") {
      return notify(urlReady ? "Preview loaded. Upload the owned or licensed audio file to convert it." : "Paste a valid URL first.", urlReady ? "info" : "error");
    }
    if (!file) return notify("Upload an audio file or paste a valid URL first.", "error");
    if (file.size > 50 * 1024 * 1024) return notify("The file exceeds the 50 MB limit.", "error");
    const data = new FormData();
    data.append("file", file, file.name);
    data.append("format", "ogg");
    data.append("bitrate", "192");
    data.append("sampleRate", "44100");
    data.append("channels", "2");
    data.append("start", "0");
    data.append("end", "");
    data.append("fadeIn", "0");
    data.append("fadeOut", "0");
    data.append("volume", "1");
    data.append("speed", "2.33");
    data.append("amplifyDb", "-4");
    data.append("filename", `${file.name.replace(/\.[^.]+$/, "")}.ogg`);
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/convert"), { method: "POST", body: data });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Conversion failed."); }
      const blob = await response.blob();
      setResult({ blob, name: `${file.name.replace(/\.[^.]+$/, "")}.ogg`, size: blob.size, title: preview?.title || file.name.replace(/\.[^.]+$/, ""), thumbnail: preview?.thumbnail || "", provider: preview?.provider || "Uploaded file" });
      notify("Conversion complete. Review the result before downloading.", "success");
    } catch (error) { notify(error.message, "error"); }
    finally { setLoading(false); }
  };
  const downloadResult = () => { if (!result) return; const link = document.createElement("a"); link.href = URL.createObjectURL(result.blob); link.download = result.name; link.click(); URL.revokeObjectURL(link.href); };
  if (mode === "studio") return <AdvancedConverter notify={notify} />;
  return <div className="view-stack"><section className="page-title"><div><p className="eyebrow">ROBLOX CONVERTER</p><h1>Prepare it for Roblox<span>.</span></h1><p className="lead">Preview a source or upload a file, then review the converted result before downloading.</p></div></section><form className="converter-layout" onSubmit={convert}><div className="workspace-panel"><div className="converter-tabs"><button type="button" className={mode === "url" ? "is-active" : ""} onClick={() => setMode("url")}><Link2 size={16} />Paste URL</button><button type="button" className={mode === "file" ? "is-active" : ""} onClick={() => setMode("file")}><FileAudio size={16} />Upload file</button><button type="button" className={mode === "studio" ? "is-active" : ""} onClick={() => setMode("studio")}><SlidersHorizontal size={16} />Studio converter</button></div>{mode === "url" ? <div className="source-panel"><p className="eyebrow">SOURCE LINK</p><h2>Preview your source</h2><div className="source-row"><input type="url" value={url} onChange={event => handleUrlInput(event.target.value)} onPaste={event => { const pastedText = (event.clipboardData || window.clipboardData)?.getData("text") || ""; if (!pastedText) return; event.preventDefault(); handleUrlInput(pastedText.trim()); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); loadPreview(url); } }} placeholder="Paste Spotify, YouTube, or SoundCloud URL" /><button type="button" className="button button-quiet button-small" disabled={!urlReady} onClick={() => loadPreview(url)}><Link2 size={15} />Preview link</button></div>{preview && <PreviewCard preview={preview} />}<p className="source-note">The link preview shows title and thumbnail. Upload the owned or licensed source file in the Upload file tab to convert it.</p></div> : <label className="dropzone converter-drop"><input type="file" accept="audio/*,.mp3,.ogg,.wav,.flac" onChange={event => { setFile(event.target.files[0] || null); setResult(null); }} /><span className="drop-icon"><FileAudio size={25} /></span><b>{file ? file.name : "Upload your audio file"}</b><small>MP3, WAV, OGG, or FLAC · max 50 MB</small><span className="button button-quiet button-small"><Plus size={15} />Browse file</span></label>}<div className="conversion-profile"><span><ShieldCheck size={17} /><b>Roblox conversion profile</b><small>OGG · 44.1 kHz stereo · speed 2.33x · gain -4 dB</small></span><em>Automatic</em></div>{result && <ResultCard result={result} onDownload={downloadResult} />}<div className="form-footer"><span><ShieldCheck size={15} />No manual settings required.</span><button className="button button-primary" disabled={loading || !(file || urlReady)}>{loading ? <><RefreshCw className="spin" size={16} />Converting...</> : <><AudioLines size={16} />Convert and review</>}</button></div></div><aside className="side-note converter-aside"><span className="note-icon"><AudioLines size={20} /></span><p className="eyebrow">RESULT REVIEW</p><h3>Download when it looks right.</h3><p>Your converted file is shown with its metadata and processing profile before you download it.</p><div className="note-list"><span><Check size={14} />Preview thumbnail and title</span><span><Check size={14} />File size and format</span><span><Check size={14} />Manual download button</span></div></aside></form></div>;
}
function PreviewCard({ preview }) { return <div className="preview-strip"><span className="preview-art">{preview.thumbnail ? <img src={preview.thumbnail} alt="" /> : preview.provider?.slice(0, 1)}</span><span><b>{preview.title}</b><small>{preview.provider} · {preview.author}</small></span><Check size={16} /></div>; }
function ResultCard({ result, onDownload }) { return <div className="conversion-result"><div className="result-art">{result.thumbnail ? <img src={result.thumbnail} alt="" /> : <FileAudio size={22} />}</div><div className="result-copy"><p className="eyebrow">CONVERSION READY</p><h3>{result.title}</h3><span>{result.provider} · {result.name} · {(result.size / 1048576).toFixed(2)} MB</span><small>Set in Roblox: OGG · stereo · speed 2.33x · gain -4 dB</small></div><button type="button" className="button button-primary button-small" onClick={onDownload}><Download size={15} />Download</button></div>; }
