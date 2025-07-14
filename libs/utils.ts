// lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-variants";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
