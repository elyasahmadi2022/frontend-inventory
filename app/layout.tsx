import { AppProviders } from "@/components/providers/app-providers";
import { GoeyToastProvider } from "@/context/GoeyToastProvider";
import { AppTooltipProvider } from "@/context/TooltipContext";
import { getApiBaseUrl } from "@/lib/api";
import { userPreferencesBootstrapScript } from "@/lib/user-preferences";
import { APP_NAME } from "@/utils/constants";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["100", "300", "400", "500", "700", "900"],
});

const iranYekan = localFont({
  variable: "--font-iranyekan",
  display: "swap",
  src: [
    {
      path: "../fonts/woff2/IRANYekanX-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/woff2/IRANYekanX-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/woff2/IRANYekanX-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/woff2/IRANYekanX-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
});

const bahijZar = localFont({
  variable: "--font-bahij-zar",
  display: "swap",
  src: "../fonts/Bahij_Zar-Bold.ttf",
});

type SettingsResponse = {
  settings?: {
    storeName?: string;
    logoUrl?: string | null;
    invoiceNote?: string | null;
  };
};

function absoluteAssetUrl(base: string, value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const fallbackDescription =
    "Store management system for accounting, inventory, sales, and purchases.";
  try {
    const base = getApiBaseUrl();
    const response = await fetch(`${base}/api/settings`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error("Settings unavailable");
    }
    const data = (await response.json()) as SettingsResponse;
    const settings = data.settings;
    const title = settings?.storeName?.trim() || APP_NAME;
    const description = settings?.invoiceNote?.trim() || fallbackDescription;
    const logoUrl = absoluteAssetUrl(base, settings?.logoUrl);
    return {
      title,
      description,
      icons: logoUrl
        ? { icon: logoUrl, shortcut: logoUrl, apple: logoUrl }
        : undefined,
    };
  } catch {
    return {
      title: APP_NAME,
      description: fallbackDescription,
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`h-full antialiased ${roboto.variable} ${iranYekan.variable} ${bahijZar.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: userPreferencesBootstrapScript }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-light-bg font-sans text-light-text dark:bg-dark-bg dark:text-dark-text"
      >
        <AppTooltipProvider>
          <GoeyToastProvider>
            <AppProviders>{children}</AppProviders>
          </GoeyToastProvider>
        </AppTooltipProvider>
      </body>
    </html>
  );
}
