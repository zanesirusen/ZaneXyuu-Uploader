import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const tracks = ["/assets/Dreams.mp3", "/assets/Why%20I%20Do.mp3", "/assets/Light%20It%20Up.mp3"];

export default function AmbientControl() {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem("zanexyuu-ambient-volume") || 0.6));
  const [track, setTrack] = useState(0);
  useEffect(() => { if (!audio.current) return; audio.current.volume = volume; audio.current.src = tracks[track]; }, [track, volume]);
  const toggle = async () => { if (!audio.current) return; if (audio.current.paused) { try { await audio.current.play(); setPlaying(true); } catch {} } else { audio.current.pause(); setPlaying(false); } };
  const next = () => setTrack(current => (current + 1) % tracks.length);
  return <div className="ambient-dock"><audio ref={audio} onEnded={next} /><button className={playing ? "is-playing" : ""} onClick={toggle} aria-label={playing ? "Mute background audio" : "Enable background audio"}>{playing ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><input type="range" min="0" max="1" step="0.01" value={volume} onChange={event => { const nextVolume = Number(event.target.value); setVolume(nextVolume); localStorage.setItem("zanexyuu-ambient-volume", String(nextVolume)); }} aria-label="Background audio volume" /></div>;
}
