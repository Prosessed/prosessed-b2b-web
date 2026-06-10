import { THEME_STORAGE_KEY } from "@/lib/theme/constants"

/** Runs before paint so refresh keeps the user-selected theme (no flash). */
export const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"){document.documentElement.classList.add("dark");}else if(t==="light"){document.documentElement.classList.remove("dark");}}catch(e){}})();`,
    }}
  />
)
