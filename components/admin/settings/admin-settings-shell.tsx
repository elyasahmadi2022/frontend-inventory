"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_SETTINGS_MVP_SECTIONS,
  ADMIN_SETTINGS_SECTIONS,
  type AdminSettingsSectionId,
} from "@/lib/admin/admin-settings-catalog";
import { useI18n } from "@/lib/i18n";
import { appRoutes } from "@/routes/app-routes";

type AdminSettingsShellProps = {
  children: ReactNode;
};

const mobileArrowClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-none border border-light-border bg-light-bg text-light-text transition hover:border-primary-500/40 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-35 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-primary-500/40 dark:hover:text-primary-400";

function AdminSettingsNavLink({
  id,
  label,
  icon: Icon,
  mvp,
  active,
  compact = false,
}: {
  id: AdminSettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mvp?: boolean;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={appRoutes.adminSettingsSection(id)}
      data-active={active ? "true" : undefined}
      className={clsx(
        "group relative flex shrink-0 items-center gap-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
        compact
          ? "rounded-none border px-3 py-1.5 whitespace-nowrap"
          : "w-full rounded-none border-s-[3px] px-3 py-2.5 lg:px-3.5",
        active
          ? compact
            ? "border-primary-500/40 bg-primary-50 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-300"
            : "border-s-primary-500 bg-primary-50/80 text-primary-700 dark:border-s-primary-500 dark:bg-primary-500/10 dark:text-primary-300"
          : compact
            ? "border-light-border bg-light-surface text-light-text hover:border-primary-500/35 hover:text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text dark:hover:border-primary-500/40 dark:hover:text-primary-400"
            : "border-s-transparent text-light-text hover:border-s-primary-500/35 hover:bg-light-bg/80 hover:text-primary-600 dark:text-dark-text dark:hover:border-s-primary-500/40 dark:hover:bg-dark-bg/60 dark:hover:text-primary-400",
      )}
    >
      <Icon
        className={clsx(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-primary-600 dark:text-primary-400"
            : "text-muted group-hover:text-primary-600 dark:group-hover:text-primary-400",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
      {mvp && !compact ? (
        <span
          className={clsx(
            "ms-auto shrink-0 rounded-sm bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/20 dark:text-primary-300",
          )}
        >
          MVP
        </span>
      ) : null}
    </Link>
  );
}

function AdminSettingsMobileNav({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isOverview = pathname === appRoutes.adminSettings;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const track = el.firstElementChild;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && track
        ? new ResizeObserver(() => updateScrollState())
        : null;
    if (resizeObserver) {
      resizeObserver.observe(el);
      if (track) resizeObserver.observe(track);
    }

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeItem = el.querySelector<HTMLElement>('[data-active="true"]');
    activeItem?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    requestAnimationFrame(updateScrollState);
  }, [pathname, updateScrollState]);

  function getScrollStep(container: HTMLDivElement): number {
    const track = container.firstElementChild as HTMLElement | null;
    const firstItem = track?.querySelector<HTMLElement>("a");
    if (firstItem) {
      const gap = 8;
      return firstItem.offsetWidth + gap;
    }
    return 120;
  }

  function scrollCategories(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const step = getScrollStep(el);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  }

  return (
    <div className="shrink-0 overflow-hidden rounded-none border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs lg:hidden">
      <div className="flex items-center gap-2 border-b border-light-border px-3 py-2 dark:border-dark-border">
        <Link
          href={appRoutes.adminSettings}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-semibold transition",
            isOverview
              ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
              : "border-light-border bg-light-bg text-light-text dark:border-dark-border dark:bg-dark-bg dark:text-dark-text",
          )}
        >
          <LayoutGrid className="size-3.5" aria-hidden="true" />
          {t("admin.settings.shell.overview")}
        </Link>
        <span className="text-[11px] text-muted">
          {t("admin.settings.shell.categoriesCount", {
            count: ADMIN_SETTINGS_SECTIONS.length,
          })}
        </span>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-2 py-2">
        <button
          type="button"
          aria-label={t("admin.settings.shell.scrollBack")}
          disabled={!canScrollLeft}
          onClick={() => scrollCategories("left")}
          className={mobileArrowClass}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div
          ref={scrollRef}
          className="settings-mobile-nav-scroll min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch] scrollbar-hidden"
        >
          <div className="flex w-max flex-nowrap items-center gap-2 py-0.5">
            {ADMIN_SETTINGS_SECTIONS.map((section) => (
              <AdminSettingsNavLink
                key={section.id}
                id={section.id}
                label={t(section.labelKey)}
                icon={section.icon}
                mvp={section.mvp}
                active={pathname === appRoutes.adminSettingsSection(section.id)}
                compact
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label={t("admin.settings.shell.scrollForward")}
          disabled={!canScrollRight}
          onClick={() => scrollCategories("right")}
          className={mobileArrowClass}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function AdminSettingsShell({ children }: AdminSettingsShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isOverview = pathname === appRoutes.adminSettings;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:gap-2">
      <aside
        aria-label={t("admin.settings.shell.ariaLabel")}
        className="shrink-0 overflow-hidden lg:flex lg:h-full lg:w-64 lg:min-h-0 lg:flex-col xl:w-72"
      >
        <AdminSettingsMobileNav pathname={pathname} />

        {/* Desktop: fixed panel — header/footer pinned, categories scroll */}
        <nav className="hidden h-full min-h-0 flex-col overflow-hidden rounded-none border border-light-border bg-light-surface shadow-sm dark:border-dark-border dark:bg-dark-surface dark:shadow-dark-xs lg:flex">
          <div className="shrink-0 rounded-none border-b border-light-border px-4 py-4 dark:border-dark-border">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
              {t("admin.settings.shell.eyebrow")}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t("admin.settings.shell.storeConfiguration")}
            </p>
            <Link
              href={appRoutes.adminSettings}
              className={clsx(
                "mt-3 flex w-full items-center gap-2.5 rounded-none border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
                isOverview
                  ? "border-primary-500/50 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300"
                  : "border-light-border bg-light-bg text-light-text hover:border-primary-500/35 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:hover:border-primary-500/40",
              )}
            >
              <LayoutGrid className="size-4 shrink-0" aria-hidden="true" />
              {t("admin.settings.shell.overview")}
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2 [-webkit-overflow-scrolling:touch] scrollbar-hidden">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {t("admin.settings.shell.categories")}
            </p>
            <div className="flex flex-col gap-0.5">
              {ADMIN_SETTINGS_SECTIONS.map((section) => (
                <AdminSettingsNavLink
                  key={section.id}
                  id={section.id}
                  label={t(section.labelKey)}
                  icon={section.icon}
                  mvp={section.mvp}
                  active={
                    pathname === appRoutes.adminSettingsSection(section.id)
                  }
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 rounded-none border-t border-light-border bg-light-bg/80 px-4 py-3 dark:border-dark-border dark:bg-dark-bg/60">
            <p className="text-[11px] leading-relaxed text-muted">
              <span className="font-semibold text-light-text dark:text-dark-text">
                {t("admin.settings.shell.mvpPriorities", {
                  count: ADMIN_SETTINGS_MVP_SECTIONS.length,
                })}
              </span>
            </p>
          </div>
        </nav>
      </aside>

      <div className="settings-content-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] scrollbar-hidden">
        <div className="pb-4 pt-3 lg:pb-6 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
