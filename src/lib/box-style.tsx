import {
  Bike, Box, Car, Dumbbell, Hammer, Leaf, Lightbulb, Paintbrush, Shirt,
  Tent, Wrench, Zap, type LucideIcon,
} from "lucide-react";

export const BOX_ICONS: Record<string, LucideIcon> = {
  box: Box,
  wrench: Wrench,
  hammer: Hammer,
  bike: Bike,
  dumbbell: Dumbbell,
  paintbrush: Paintbrush,
  zap: Zap,
  lightbulb: Lightbulb,
  car: Car,
  tent: Tent,
  leaf: Leaf,
  shirt: Shirt,
};

export const BOX_COLORS = ["orange", "yellow", "steel", "red", "green", "blue"] as const;

export function BoxIcon({ name, ...props }: { name: string } & React.ComponentProps<LucideIcon>) {
  const Icon = BOX_ICONS[name] ?? Box;
  return <Icon {...props} />;
}

export function boxTone(color: string): string {
  return `tone-${(BOX_COLORS as readonly string[]).includes(color) ? color : "orange"}`;
}
