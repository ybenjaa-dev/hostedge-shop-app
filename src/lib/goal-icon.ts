import { Zap, ShieldCheck, Moon, Dumbbell, Leaf, Bone, Pill, Sparkles, Brain, Heart, type LucideIcon } from "lucide-react";

/** Pick an icon for a health goal from its slug/name keywords (any language). */
export function goalIcon(key: string): LucideIcon {
  const k = key.toLowerCase();
  const has = (...w: string[]) => w.some((x) => k.includes(x));
  if (has("energ", "طاقة", "focus", "concentr", "تركيز")) return Zap;
  if (has("immun", "مناعة", "defen")) return ShieldCheck;
  if (has("sleep", "sommeil", "stress", "نوم", "توتر", "calm")) return Moon;
  if (has("muscle", "sport", "protein", "عضل", "رياض", "fitness")) return Dumbbell;
  if (has("digest", "هضم", "gut", "probio", "intest")) return Leaf;
  if (has("joint", "bone", "articul", "مفاصل", "عظام", "collag")) return Bone;
  if (has("skin", "peau", "hair", "cheveux", "beaut", "بشرة", "شعر")) return Sparkles;
  if (has("brain", "memo", "cerveau", "mind")) return Brain;
  if (has("heart", "coeur", "cœur", "omega", "قلب")) return Heart;
  return Pill;
}
