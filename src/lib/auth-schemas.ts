import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email").max(255);
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(24, "Max 24 characters")
  .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, . or _ only");

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
  remember: z.boolean().optional(),
});

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) s++;
  const map = [
    { label: "Too weak", color: "bg-destructive" },
    { label: "Weak", color: "bg-destructive/70" },
    { label: "Fair", color: "bg-blush" },
    { label: "Strong", color: "bg-berry" },
    { label: "Excellent", color: "bg-lime" },
  ] as const;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  return { score, ...map[score] };
}
