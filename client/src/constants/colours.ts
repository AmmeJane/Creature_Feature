export const COLOUR_HEX: Record<string, string> = {
  red:    "#E91429",
  blue:   "#509BF5",
  green:  "#1DB954",
  yellow: "#F59B23",
  purple: "#BC5900",
  orange: "#E8400C",
  cyan:   "#148A08",
};

export const S = {
  green:    "#1DB954",
  black:    "#000000",
  base:     "#121212",
  elevated: "#1A1A1A",
  card:     "#242424",
  subtle:   "#2A2A2A",
  border:   "#333333",
  white:    "#FFFFFF",
  muted:    "#A7A7A7",
  dim:      "#6A6A6A",
  font:     "'Circular Std', 'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export const STATE_COLOUR: Record<string, string> = {
  Idle:     S.dim,
  Moving:   S.green,
  Sleeping: "#509BF5",
  Running:  "#F59B23",
};

export const STATES = ["Idle", "Moving", "Sleeping", "Running"] as const;