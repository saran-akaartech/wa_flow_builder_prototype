"use client";

import * as React from "react";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-wa-green text-wa-ink hover:bg-wa-green/90 focus-visible:ring-wa-green",
  ghost:
    "bg-transparent text-slate-300 hover:bg-ink-700 focus-visible:ring-ink-500",
  outline:
    "border border-line bg-ink-800 text-slate-200 hover:bg-ink-700 focus-visible:ring-ink-500",
  danger:
    "bg-transparent text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(({ className, variant = "outline", ...props }, ref) => (
  <button
    ref={ref}
    className={cx(
      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
      "disabled:pointer-events-none disabled:opacity-50",
      buttonVariants[variant],
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cx(
      "w-full rounded-lg border border-line bg-ink-900 px-3 py-2 text-sm text-slate-100",
      "placeholder:text-slate-500 focus:border-wa-green focus:outline-none focus:ring-1 focus:ring-wa-green",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cx(
      "w-full resize-y rounded-lg border border-line bg-ink-900 px-3 py-2 text-sm text-slate-100",
      "placeholder:text-slate-500 focus:border-wa-green focus:outline-none focus:ring-1 focus:ring-wa-green",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("rounded-xl border border-line bg-ink-800", className)}>
      {children}
    </div>
  );
}

export function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cx(
        "mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400",
        className
      )}
    >
      {children}
    </label>
  );
}
