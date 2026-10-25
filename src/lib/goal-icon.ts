import { Smartphone, Headphones, Watch, BatteryCharging, Speaker, Keyboard, Lightbulb, Laptop, Camera, Zap, ShieldCheck, Moon, Dumbbell, Leaf, Bone, Pill, Sparkles, Brain, Heart, type LucideIcon } from "lucide-react";

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

/** Icon for an electronics category from its slug/name keywords (any language). */
export function techIcon(key: string): LucideIcon {
  const k = key.toLowerCase();
  const has = (...w: string[]) => w.some((x) => k.includes(x));
  if (has("smart-home", "smart home", "home", "light", "bulb", "maison", "منزل", "إضاءة")) return Lightbulb;
  if (has("phone", "mobile", "téléphone", "هاتف", "هواتف", "tablet")) return Smartphone;
  if (has("audio", "sound", "headphone", "earbud", "صوت", "سماع")) return Headphones;
  if (has("wear", "watch", "montre", "connect", "ساعة", "ذكية")) return Watch;
  if (has("power", "charg", "batter", "énergie", "شحن", "طاقة")) return BatteryCharging;
  if (has("speaker", "enceinte", "مكبر")) return Speaker;
  if (has("compute", "keyboard", "mouse", "pc", "laptop", "informatique", "كمبيوتر", "حاسوب")) return has("laptop") ? Laptop : Keyboard;
  if (has("camera", "photo", "كاميرا")) return Camera;
  return Zap;
}
