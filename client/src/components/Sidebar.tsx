import type { CreatureSnapshot } from "../types/CreatureTypes";
import { S, COLOUR_HEX, STATE_COLOUR } from "../constants/colours";
import { FilterPill } from "./ui/primitives";
import { getCreatureEmoji } from "../utils/creatureHelpers";
import type { CreatureType} from "../components/creatures/DinoMeshes";
import { geneToColourHex } from "../components/creatures/ProceduralCreature";

interface SidebarProps {
  snapshots: CreatureSnapshot[];
  selected: string | null;
  hoveredId: string | null;
  typeMapRef: React.MutableRefObject<Record<string, string>>;
  spawning: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onSpawn: () => void;
}

export function Sidebar({
  snapshots,
  selected,
  hoveredId,
  typeMapRef,
  spawning,
  onSelect,
  onHover,
  onSpawn,
}: SidebarProps) {
  return (
    <div
      style={{
        width: 280,
        background: S.base,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: `1px solid ${S.border}`,
      }}
    >
      <div
        style={{
          padding: "20px 16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: S.muted,
            letterSpacing: 0.5,
          }}
        >
          YOUR HERD
        </span>
        <button
          onClick={onSpawn}
          disabled={spawning}
          style={{
            background: spawning ? S.dim : S.green,
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            cursor: spawning ? "default" : "pointer",
            color: S.black,
            fontSize: 18,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            transition: "background 0.2s",
          }}
        >
          {spawning ? "…" : "+"}
        </button>
      </div>

      <div style={{ padding: "4px 16px 12px", display: "flex", gap: 6 }}>
        <FilterPill active>All</FilterPill>
        <FilterPill>Moving</FilterPill>
        <FilterPill>Sleeping</FilterPill>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {snapshots.map((c) => {
          const type: CreatureType = typeMapRef.current[c.id] ?? "raptor";
          const emoji = getCreatureEmoji(type);
          const isActive = selected === c.id;
          const isHov = hoveredId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              onMouseEnter={() => onHover(c.id)}
              onMouseLeave={() => onHover(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px",
                borderRadius: 6,
                cursor: "pointer",
                background: isActive
                  ? S.card
                  : isHov
                    ? S.elevated
                    : "transparent",
                transition: "background 0.15s",
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${geneToColourHex(c.genes.colour) ?? "#fff"}88, ${geneToColourHex(c.genes.colour) ?? "#fff"}22)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                  border: isActive
                    ? `1px solid ${geneToColourHex(c.genes.colour) ?? "#fff"}`
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? `0 0 12px ${geneToColourHex(c.genes.colour) ?? "#fff"}44`
                    : "none",
                  transition: "all 0.2s",
                }}
              >
                {emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? S.green : S.white,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: STATE_COLOUR[c.state],
                    marginTop: 1,
                  }}
                >
                  ● {c.state} · {type}
                </div>
              </div>
              {isActive && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 1.5,
                    height: 16,
                  }}
                >
                  {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 3,
                        height: `${h * 100}%`,
                        background: S.green,
                        borderRadius: 1,
                        animation: `bar${i} 0.8s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
