import { brandPalette } from "@/lib/design-tokens";

export function useBrandTheme() {
  return {
    palette: brandPalette,
    primary: brandPalette.primary500,
    background: brandPalette.lightBackground,
    surface: brandPalette.lightSurface,
    text: brandPalette.lightText,
  };
}
