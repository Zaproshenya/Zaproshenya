export function Icon({ name, size = 20, weight = 'duotone', color }: { name: string; size?: number; weight?: string; color?: string }) {
  return (
    <i 
      className={`ph ph-${name}`} 
      style={{ fontSize: `${size}px`, verticalAlign: 'middle', lineHeight: 1, color }}
    />
  );
}
