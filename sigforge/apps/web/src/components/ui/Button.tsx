"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50";
    const variants = {
      primary: "bg-brand text-white hover:bg-blue-700",
      secondary: "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
      ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
    };
    return <button ref={ref} className={twMerge(base, variants[variant], className)} {...rest} />;
  },
);
Button.displayName = "Button";
