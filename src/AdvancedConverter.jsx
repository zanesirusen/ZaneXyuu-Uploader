import { useEffect, useRef, useState } from "react";
import { AudioLines, Check, Download, FileAudio, Pause, Play, Plus, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { apiUrl } from "./api";

const initial = { format: "ogg", bitrate: "192", sampleRate: "44100", channels: "2", start: "0", end: "", volume: "1", fade: "0", speed: "2.33", gain: "-4", title: "", artist: "", album: "", outputName: "" };
const presets = {
  "Roblox Voice": { format: "ogg", bitrate: "128", sampleRate: "44100", channels: "1", speed: "1", gain: "-4" },
  "Roblox Music": { format: "ogg", bitrate: "192", sampleRate: "44100", channels: "2", speed: "2.33", gain: "-4" },
  "Clean Audio": { format: "wav", bitrate: "320", sampleRate: "48000", channels: "2", speed: "1", gain: "0" },
  "Compact File": { format: "mp3", bitrate: "128", sampleRate: "44100", channels: "2", speed: "1", gain: "-6" }
};

export default function AdvancedConverter({ notify }) {
  const [file, setFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [options, setOptions] = useState(initial);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const update = (key, value) => setOptions(current => ({ ...current, [key]: value }));
  const applyPreset = name => setOptions(current => ({ ...current, ...presets[name] }));

  useEffect(() => {
    if (!file) { setDuration(0); return undefined; }
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    return () => { audio.src = ""; URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => {
    if (!file || !waveformRef.current) return;
    let cancelled = false;
    const draw = async () => {
      try {
        const context = new AudioContext();
        const buffer = await context.decodeAudioData(await file.arrayBuffer());
        if (cancelled) { context.close(); return; }
        const canvas = waveformRef.current;
        const ctx = canvas.getContext("2d");
        const width = canvas.width = canvas.clientWidth * 2;
        const height = canvas.height = canvas.clientHeight * 2;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#71b9ff";
        const data = buffer.getChannelData(0);
        const bars = Math.max(40, Math.floor(width / 7));
        const step = Math.max(1, Math.floor(data.length / bars));
        for (let i = 0; i < bars; i += 1) {
          let peak = 0;
          for (let j = 0; j < step; j += 1) peak = Math.max(peak, Math.abs(data[i * step + j] || 0));
          const barHeight = Math.max(3, peak * height * 0.85);
          ctx.fillRect(i * width / bars, (height - barHeight) / 2, Math.max(2, width / bars - 2), barHeight);
        }
        context.close();
      } catch { /* Some formats cannot be decoded by the browser; keep the lightweight placeholder. */ }
    };
    draw();
    return () => { cancelled = true; };
  }, [file]);

  const loadPreview = async () => {
    if (!sourceUrl.trim()) return notify("Paste a Spotify, YouTube, or SoundCloud link first.", "error");
    try {
      const response = await fetch(`${apiUrl("/api/preview")}?url=${encodeURIComponent(sourceUrl.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Preview could not be loaded.");
      setPreview(data);
      setOptions(current => ({ ...current, title: current.title || data.title || "", artist: current.artist || data.author || "" }));
      notify("Link preview ready.", "success");
    } catch (error) { notify(error.message, "error"); }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !resultUrl) return;
    if (audioRef.current.paused) { audioRef.current.play(); setPlaying(true); } else { audioRef.current.pause(); setPlaying(false); }
  };
  const submit = async event => {
    event.preventDefault();
    const start = Number(options.start || 0);
    const end = options.end === "" ? duration : Number(options.end);
    if (!file) return notify("Choose an audio file first.", "error");
    if (file.size > 50 * 1024 * 1024) return notify("The file exceeds the 50 MB limit.", "error");
    if (!Number.isFinite(start) || start < 0 || (duration && start >= duration)) return notify("Trim start must be within the audio duration.", "error");
    if (options.end !== "" && (!Number.isFinite(end) || end <= start || (duration && end > duration))) return notify("Trim end must be after start and within the audio duration.", "error");
    const data = new FormData();
    data.append("file", file, file.name);
    Object.entries(options).forEach(([key, value]) => { if (key !== "gain" && key !== "fade") data.append(key, value); });
    data.append("amplifyDb", options.gain); data.append("fadeIn", options.fade); data.append("fadeOut", options.fade); data.append("filename", options.outputName || file.name);
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/convert"), { method: "POST", body: data });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "Conversion failed."); }
      const blob = await response.blob();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url); setPlaying(false);
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const name = match?.[1] || `${file.name.replace(/\.[^.]+$/, "")}.${options.format}`;
      const link = document.createElement("a"); link.href = url; link.download = name; link.click();
      notify("Conversion complete. Result preview is ready.", "success");
    } catch (error) { notify(error.message, "error"); } finally { setLoading(false); }
  };
  return <div className="view-stack"><section className="page-title"><div><p className="eyebrow">AUDIO CONVERTER</p><h1>Shape your sound<span>.</span></h1><p className="lead">Prepare owned or licensed audio with the same conversion controls as the original workspace.</p></div><div className="format-badge"><AudioLines size={20} /><b>MP3 · WAV · OGG · FLAC</b></div></section><form className="converter-layout" onSubmit={submit}><div className="workspace-panel"><div className="panel-header"><div><p className="eyebrow">01 / SOURCE</p><h2>Choose an audio file</h2></div><span className={`status-label ${file ? "is-ready" : ""}`}>{file ? "READY" : "WAITING"}</span></div><div className="source-row"><input type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="Paste Spotify, YouTube, or SoundCloud URL" /><button type="button" className="button button-quiet button-small" onClick={loadPreview}>Preview link</button></div>{preview && <div className="preview-strip"><span className="preview-art">{preview.thumbnail ? <img src={preview.thumbnail} alt="" /> : preview.provider?.slice(0, 1)}</span><span><b>{preview.title}</b><small>{preview.provider} · {preview.author}</small></span><Check size={16} /></div>}<label className="dropzone converter-drop"><input type="file" accept="audio/*,.mp3,.ogg,.wav,.flac" onChange={event => setFile(event.target.files[0] || null)} /><span className="drop-icon"><FileAudio size={25} /></span><b>{file ? file.name : "Upload your audio file"}</b><small>MP3, WAV, OGG, or FLAC · max 50 MB</small><span className="button button-quiet button-small"><Plus size={15} />Browse file</span></label>{file && <div className="audio-inspector"><div className="inspector-meta"><span>Audio duration <b>{formatTime(duration)}</b></span><span>{duration ? `${options.start || 0}s – ${options.end || formatTime(duration)}` : "Reading duration..."}</span></div><canvas ref={waveformRef} className="waveform" aria-label="Audio waveform preview" /></div>}<div className="preset-strip preset-picker"><span><Sparkles size={17} /><b>Conversion presets</b><small>Quickly tune output for Roblox and sharing</small></span><select value="" onChange={event => { if (event.target.value) applyPreset(event.target.value); }} aria-label="Choose conversion preset"><option value="">Choose preset</option>{Object.keys(presets).map(name => <option key={name}>{name}</option>)}<option value="Roblox Music">Speed 2.33x (Roblox Music)</option></select></div>{resultUrl && <div className="result-preview"><div><p className="eyebrow">RESULT PREVIEW</p><b>Converted {options.format.toUpperCase()} audio</b></div><button type="button" className="button button-quiet button-small" onClick={togglePlayback}>{playing ? <><Pause size={15} />Pause</> : <><Play size={15} />Play</>}</button><audio ref={audioRef} src={resultUrl} onEnded={() => setPlaying(false)} controls /></div>}<div className="panel-header output-heading"><div><p className="eyebrow">02 / OUTPUT</p><h2>Set the signal</h2></div></div><div className="form-grid"><Field label="Format"><select value={options.format} onChange={event => update("format", event.target.value)}><option value="mp3">MP3</option><option value="wav">WAV</option><option value="ogg">OGG</option><option value="flac">FLAC</option></select></Field>{options.format === "mp3" && <Field label="Bitrate"><select value={options.bitrate} onChange={event => update("bitrate", event.target.value)}><option value="128">128 kbps</option><option value="192">192 kbps</option><option value="256">256 kbps</option><option value="320">320 kbps</option></select></Field>}<Field label="Sample rate"><select value={options.sampleRate} onChange={event => update("sampleRate", event.target.value)}><option value="22050">22.05 kHz</option><option value="44100">44.1 kHz</option><option value="48000">48 kHz</option><option value="96000">96 kHz</option></select></Field><Field label="Channels"><select value={options.channels} onChange={event => update("channels", event.target.value)}><option value="1">Mono</option><option value="2">Stereo</option></select></Field><Field label={`Start (seconds${duration ? ` / max ${formatTime(duration)}` : ""})`}><input type="number" min="0" max={duration || undefined} step="0.1" value={options.start} onChange={event => update("start", event.target.value)} /></Field><Field label="End (seconds)"><input type="number" min="0" max={duration || undefined} step="0.1" value={options.end} onChange={event => update("end", event.target.value)} placeholder="End of track" /></Field><Field label={`Volume ${Math.round(Number(options.volume) * 100)}%`}><input type="range" min="0" max="3" step="0.05" value={options.volume} onChange={event => update("volume", event.target.value)} /></Field><Field label="Fade in / out"><input type="number" min="0" max="60" step="0.1" value={options.fade} onChange={event => update("fade", event.target.value)} /></Field><Field label="Speed"><select value={options.speed} onChange={event => update("speed", event.target.value)}><option value="1">1x Normal</option><option value="0.5">0.5x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option><option value="2.33">2.33x Roblox</option><option value="3">3x</option></select></Field><Field label="Gain (dB)"><input type="number" min="-30" max="12" step="0.1" value={options.gain} onChange={event => update("gain", event.target.value)} /></Field></div><div className="panel-header output-heading"><div><p className="eyebrow">03 / IDENTITY</p><h2>Keep the details</h2></div></div><div className="form-grid"><Field label="Title"><input value={options.title} onChange={event => update("title", event.target.value)} maxLength="100" /></Field><Field label="Artist"><input value={options.artist} onChange={event => update("artist", event.target.value)} maxLength="100" /></Field><Field label="Album"><input value={options.album} onChange={event => update("album", event.target.value)} maxLength="100" /></Field><Field label="Output name"><input value={options.outputName} onChange={event => update("outputName", event.target.value)} placeholder="Converted audio" maxLength="100" /></Field></div><div className="form-footer"><span><ShieldCheck size={15} />Temporary processing file.</span><button className="button button-primary" disabled={loading}>{loading ? <><RefreshCw className="spin" size={16} />Converting...</> : <><Download size={16} />Convert and download</>}</button></div></div><aside className="side-note converter-aside"><span className="note-icon"><AudioLines size={20} /></span><p className="eyebrow">WORKFLOW NOTE</p><h3>Ready for the next take.</h3><p>The converter changes technical properties of your source file. It does not remove ownership claims or platform copyright checks.</p><div className="note-list"><span><Check size={14} />Temporary server processing</span><span><Check size={14} />Metadata and trimming controls</span></div></aside></form></div>;
}
function formatTime(seconds) { if (!seconds || !Number.isFinite(seconds)) return "0:00"; const minutes = Math.floor(seconds / 60); return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`; }
function Field({ label, children }) { return <label>{label}{children}</label>; }
