import Image from "next/image";
import { PWA_ICON_PATHS } from "@/lib/pwa/config";

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
} as const;

const RADIUS_CLASS = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-xl",
  xl: "rounded-2xl",
} as const;

export function AppLogo({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZE_PX;
  className?: string;
}) {
  const px = SIZE_PX[size];
  return (
    <Image
      src={PWA_ICON_PATHS.icon192}
      alt=""
      width={px}
      height={px}
      className={`shrink-0 ${RADIUS_CLASS[size]} ${className}`}
      aria-hidden
      priority={size === "md" || size === "sm"}
    />
  );
}
