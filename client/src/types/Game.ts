export interface MiniGameMeta {
  id:          string;
  title:       string;
  description: string;
  emoji:       string;
  controls:    string;
  component:   React.ComponentType<MiniGameProps>;
}

export interface MiniGameProps {
  onScore?: (score: number) => void;
}