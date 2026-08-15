/**
 * Theme plumbing shared by the no-FOUC script in the root layout and the
 * in-app Light / Dark / Auto switcher.
 *
 * The browser/PWA status bar is driven by a single `<meta name="theme-color">`
 * that we update ourselves. It deliberately does NOT use the
 * `prefers-color-scheme` media-query form: the app's theme comes from
 * localStorage, so a user on Dark with a light-mode phone would otherwise get a
 * light status bar above a dark app.
 */

/** Must match `--background` for each theme in `globals.css`. */
export const THEME_COLORS = {
  light: "#faf8f4",
  dark: "#17150f",
} as const;

export const THEME_STORAGE_KEY = "theme";

/**
 * Apply a resolved (concrete) theme to <html> and the status bar.
 *
 * The `<meta name="theme-color">` is created here rather than declared in the
 * route's `viewport` export. Next re-emits metadata tags during hydration, so a
 * declared tag we then mutate ends up duplicated — two conflicting theme-colors
 * in the document, with the browser picking whichever came first. Owning the
 * tag outright keeps exactly one.
 */
export function applyResolvedTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = dark ? THEME_COLORS.dark : THEME_COLORS.light;
}

/**
 * The pre-paint script, as a string for `dangerouslySetInnerHTML`. Resolves the
 * saved choice and applies it before first paint so there's no flash of the
 * wrong theme — and no flash of the wrong status bar. Mirrors
 * {@link applyResolvedTheme}; kept inline (not imported) because it must run
 * before hydration.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}m.content=d?'${THEME_COLORS.dark}':'${THEME_COLORS.light}';}catch(e){}})();`;
