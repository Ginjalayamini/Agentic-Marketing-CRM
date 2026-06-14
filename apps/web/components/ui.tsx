import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60",
        props.className
      )}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-lg border border-line bg-panel p-5 shadow-xl shadow-black/10", className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "focus-ring h-10 w-full rounded-md border border-line bg-background px-3 text-sm text-ink placeholder:text-muted",
        props.className
      )}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn("rounded-full border border-line px-2.5 py-1 text-xs text-muted", className)} />;
}
