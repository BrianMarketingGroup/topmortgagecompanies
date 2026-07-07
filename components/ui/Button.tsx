import Link from "next/link";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-primary-dark font-semibold hover:bg-accent-light active:bg-accent-dark border border-accent disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "bg-primary text-white font-semibold hover:bg-primary-light active:bg-primary-dark border border-primary disabled:opacity-50 disabled:pointer-events-none",
  outline:
    "bg-transparent text-primary font-semibold border border-primary hover:bg-primary/5 disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "bg-transparent text-muted font-medium border border-transparent hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-md",
  md: "px-6 py-3 text-base rounded-lg",
  lg: "px-8 py-4 text-lg rounded-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  external,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
