// Tailwind v4 emits its own vendor prefixes, so autoprefixer was redundant here.
// There was also a postcss.config.mjs alongside this file that PostCSS never read,
// which meant edits to the file a Next 16 developer reaches for first did nothing.
module.exports = {
    plugins: {
        "@tailwindcss/postcss": {},
    },
}
