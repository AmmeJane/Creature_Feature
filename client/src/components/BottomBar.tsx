import { useEffect, useRef, useState } from "react";
import type { CreatureSnapshot } from "../types/CreatureTypes";
import { S, COLOUR_HEX } from "../constants/colours";
import { ControlBtn } from "./ui/primitives";
import { getCreatureEmoji } from "../utils/creatureHelpers";
import { fetchTrackPreview } from "../api/creature";
import { geneToColourHex } from "./creatures/ProceduralCreature";

interface BottomBarProps {
  sel: CreatureSnapshot | null;
  selType: string | null;
  tick: number;
  running: boolean;
  spawning: boolean;
  count: number;
  onToggleRun: () => void;
  onSpawn: () => void;
}

interface TrackInfo {
  name: string;
  artist: string;
  albumArt: string | null;
  previewUrl: string | null;
}

export function BottomBar({
  sel,
  selType,
  tick,
  running,
  spawning,
  count,
  onToggleRun,
  onSpawn,
}: BottomBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.1);

  // ── Fetch + play when creature selected ──────────────────────────────────
  useEffect(() => {
    if (!sel) {
      audioRef.current?.pause();
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setTrack(null);
      return;
    }

    

    let cancelled = false;

    const load = async () => {
      audioRef.current?.pause();
      setLoading(true);
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setTrack(null);

      try {
        const info = await fetchTrackPreview(sel.songId ?? sel.id);
        if (cancelled) return;
        setTrack(info);

        if (!info.previewUrl) {
          setLoading(false);
          return;
        }

        const audio = new Audio(info.previewUrl);
        audio.volume = volume;
        audioRef.current = audio;

        audio.addEventListener("loadedmetadata", () => {
          setDuration(audio.duration || 30);
          setLoading(false);
        });
        audio.addEventListener("timeupdate", () => {
          setCurrentTime(audio.currentTime);
          setProgress(audio.currentTime / (audio.duration || 30));
        });
        audio.addEventListener("ended", () => {
          setPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        });
        audio.addEventListener("error", () => {
          setLoading(false);
          setPlaying(false);
        });

        audio
          .play()
          .then(() => {
            if (!cancelled) setPlaying(true);
          })
          .catch(() => setLoading(false));
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    

    load();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [sel?.id]);

  useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime =
      ((e.clientX - rect.left) / rect.width) * (audio.duration || 30);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const accentColor = sel ? (COLOUR_HEX[sel.colour] ?? S.green) : S.green;

  

  return (
    <div
      style={{
        height: 80,
        background: S.elevated,
        borderTop: `1px solid ${S.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 24,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Left: track info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: 260,
          flexShrink: 0,
        }}
      >
        {sel && selType ? (
          <>
            {/* Album art or creature emoji fallback */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 4,
                overflow: "hidden",
                flexShrink: 0,
                background: `linear-gradient(135deg, ${accentColor}88, ${accentColor}22)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {track?.albumArt ? (
                <img
                  src={track.albumArt}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getCreatureEmoji(selType)
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: S.white,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {loading ? "Loading..." : (track?.name ?? sel.name)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: S.muted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 2,
                }}
              >
                {loading ? "—" : (track?.artist ?? selType)}
              </div>
              {!loading && track && !track.previewUrl && (
                <div style={{ fontSize: 9, color: "#E91429", marginTop: 2 }}>
                  No preview available
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: S.dim }}>Select a creature</div>
        )}
      </div>

      {/* Centre: playback controls + progress */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <ControlBtn>⇄</ControlBtn>
          <ControlBtn>⏮</ControlBtn>
          <button
            onClick={sel && track?.previewUrl ? toggleAudio : onToggleRun}
            disabled={loading}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: S.white,
              border: "none",
              cursor: loading ? "default" : "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: S.black,
              flexShrink: 0,
              opacity: loading ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "⏳" : playing ? "⏸" : "▶"}
          </button>
          <ControlBtn>⏭</ControlBtn>
          <ControlBtn>↺</ControlBtn>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 480,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: S.dim,
              width: 32,
              textAlign: "right",
            }}
          >
            {sel && track?.previewUrl ? fmt(currentTime) : "0:00"}
          </span>
          <div
            onClick={sel && track?.previewUrl ? handleSeek : undefined}
            style={{
              flex: 1,
              height: 4,
              background: S.border,
              borderRadius: 2,
              cursor: sel && track?.previewUrl ? "pointer" : "default",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  sel && track?.previewUrl
                    ? `${progress * 100}%`
                    : 0,
                background: sel && track?.previewUrl ? accentColor : S.green,
                borderRadius: 2,
                transition: sel && track?.previewUrl ? "none" : "width 0.1s",
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: S.dim, width: 32 }}>
            {sel && track?.previewUrl ? fmt(duration) : "0:00"}
          </span>
        </div>
      </div>

      {/* Right: volume + spawn */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: 220,
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: S.dim }}>{count} creatures</span>
        <span
          onClick={() => setVolume((v) => (v > 0 ? 0 : 0.7))}
          style={{ color: S.muted, fontSize: 14, cursor: "pointer" }}
        >
          {volume === 0 ? "🔇" : "🔊"}
        </span>
        <div
          style={{
            width: 80,
            height: 4,
            background: S.border,
            borderRadius: 2,
            cursor: "pointer",
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setVolume(
              Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
            );
          }}
        >
          <div
            style={{
              width: `${volume * 100}%`,
              height: "100%",
              background: S.muted,
              borderRadius: 2,
            }}
          />
        </div>
       
      </div>
    </div>
  );
}
