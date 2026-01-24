"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Home, Dumbbell, BarChart2, User } from "lucide-react";

const NAV_KEYS = [
  { key: "nav.home", href: "/", icon: Home },
  { key: "nav.workout", href: "/workout", icon: Dumbbell },
  { key: "nav.data", href: "/data", icon: BarChart2 },
  { key: "nav.profile", href: "/profile", icon: User },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe pt-2 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {NAV_KEYS.map(({ key, href, icon: Icon }) => {
          const isActive = pathname === href;
          const name = t(key);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 pb-4 transition-colors ${isActive
                ? "text-blue-600 dark:text-blue-500"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "fill-current/20" : ""}`} />
              <span className="text-[10px] font-medium">{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



