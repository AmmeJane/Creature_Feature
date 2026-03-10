import type { CreatureSnapshot } from "../types/CreatureTypes";
import { S, COLOUR_HEX, STATE_COLOUR, STATES } from "../constants/colours";
import { SpotifyBar, StatCard } from "./ui/primitives";
import { CreaturePreview } from "../components/creatures/CreaturePreview";
import type { DinoType } from "../components/creatures/DinoMeshes";

interface NowPlayingProps {
  sel: CreatureSnapshot;
  selType: DinoType;
  onClose: () => void;
  onRemove: (id: string) => void;
  onChangeState: (id: string, state: any) => void;
}

export function NowPlaying({
  sel,
  selType,
  onClose,
  onRemove,
  onChangeState,
}: NowPlayingProps) {
    const colour = COLOUR_HEX[sel.colour] ?? "#fff";
  return (
    <div
      style={{
        width: 300,
        background: S.base,
        borderLeft: `1px solid ${S.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "16px 16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: S.muted,
            letterSpacing: 0.5,
          }}
        >
          NOW PLAYING
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: S.dim,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Name */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
          {sel.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: S.muted,
            marginTop: 2,
            textTransform: "capitalize",
          }}
        ></div>
      </div>

      {/* State badge */}
      <div style={{ padding: "10px 16px 0" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: STATE_COLOUR[sel.state] + "22",
            border: `1px solid ${STATE_COLOUR[sel.state]}44`,
            borderRadius: 12,
            padding: "4px 10px",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: STATE_COLOUR[sel.state],
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: STATE_COLOUR[sel.state],
            }}
          >
            {sel.state.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Gene bars */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: S.muted,
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          GENETICS
        </div>
        <SpotifyBar label="SIZE GENE" value={sel.genes.size} color={S.green} />
        <SpotifyBar
          label="SPEED GENE"
          value={sel.genes.speed}
          color="#509BF5"
        />
        <SpotifyBar
          label="COLOUR GENE"
          value={sel.genes.colour}
          color={COLOUR_HEX[sel.colour] ?? "#fff"}
        />
      </div>

      {/* Stat grid */}
      <div
        style={{
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <StatCard
          label="SIZE"
          value={sel.size}
          color={COLOUR_HEX[sel.colour] ?? "#fff"}
        />
        <StatCard label="SPEED" value={sel.speed} color="#509BF5" />
        <StatCard
          label="COLOUR"
          value={sel.colour}
          color={COLOUR_HEX[sel.colour] ?? "#fff"}
          isText
        />
      
      </div>
    {/* 3D creature preview */}
      <div style={{ margin:"16px 16px 12px", borderRadius:8, background:`linear-gradient(135deg, ${colour}33, ${colour}08)`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", aspectRatio:"1", boxShadow:`0 8px 32px ${colour}44` }}>
        <CreaturePreview dinoType={selType} colour={colour} size={268} />
      </div>
       {/* Name + type */}
      <div style={{ padding:"0 16px" }}>
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:-0.3 }}>{sel.name}</div>
        <div style={{ fontSize:12, color:S.muted, marginTop:2, textTransform:"capitalize" }}>{selType}</div>
      </div>

      {/* State badge */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:STATE_COLOUR[sel.state]+"22", border:`1px solid ${STATE_COLOUR[sel.state]}44`, borderRadius:12, padding:"4px 10px" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:STATE_COLOUR[sel.state] }} />
          <span style={{ fontSize:11, fontWeight:600, color:STATE_COLOUR[sel.state] }}>{sel.state.toUpperCase()}</span>
        </div>
      </div>

      {/* State controls */}
      <div style={{ padding: "0 16px 8px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: S.muted,
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          CONTROL
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => onChangeState(sel.id, s)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "5px 12px",
                background: sel.state === s ? STATE_COLOUR[s] : "transparent",
                border: `1px solid ${STATE_COLOUR[s]}`,
                color: sel.state === s ? S.black : STATE_COLOUR[s],
                borderRadius: 12,
                cursor: "pointer",
                letterSpacing: 0.5,
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Remove */}
      <div style={{ padding: "8px 16px 16px", marginTop: "auto" }}>
        <button
          onClick={() => onRemove(sel.id)}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px solid ${S.border}`,
            color: S.muted,
            borderRadius: 4,
            padding: "8px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "#E91429";
            (e.target as HTMLButtonElement).style.color = "#E91429";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = S.border;
            (e.target as HTMLButtonElement).style.color = S.muted;
          }}
        >
          Remove from Herd
        </button>
      </div>
    </div>
  );
}
