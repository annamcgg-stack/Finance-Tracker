import { APP_NAME } from "@/lib/branding";

export function AppBrandName({ className = "" }: { className?: string }) {
  return <span className={`font-semibold text-foreground ${className}`.trim()}>{APP_NAME}</span>;
}
