import Image from "next/image";

// Official marks, never recoloured. A dark entry is the brand's own variant for dark grounds.
const LOGOS = {
    airbnb: { src: "/logos/airbnb.svg", w: 24, h: 24 },
    langchain: { src: "/logos/langchain-light.svg", dark: "/logos/langchain-dark.svg", w: 63, h: 63 },
    iso: { src: "/logos/iso.svg", w: 1181, h: 1087 },
    harvard: { src: "/logos/harvard-shield.svg", w: 127, h: 149 },
    // NC State's opaque red brick is its preferred version on any ground, so it has no dark variant.
    ncstate: { src: "/logos/ncstate-brick.png", w: 1080, h: 520 },
    techmahindra: { src: "/logos/techmahindra-light.svg", dark: "/logos/techmahindra-dark.svg", w: 200, h: 50 },
} as const;

// "self" is the site's own [ AD ] mark, for personal and freelance work.
export type Org = keyof typeof LOGOS | "self";

// Every mark covers the same area, not the same height, so a 4:1 lockup reads the same size as a square one.
// --logo-s is the side of that square; the default suits a display-m heading.
const SIZE = "[--logo-s:2rem] md:[--logo-s:2.25rem]";

// Decorative by default, since the name usually sits beside the mark; pass alt where it does not.
// Served as is, since the optimiser's srcset stops at 2x; width and height only set the aspect ratio.
export function OrgLogo({ org, className = SIZE, alt = "" }: { org: Org; className?: string; alt?: string }) {
    if (org === "self") {
        // Text in the nav's mono, so it takes ink or white from the mode; 0.49em gives it the same area.
        return (
            <span aria-hidden="true" style={{ fontSize: "calc(var(--logo-s) * 0.49)" }} className={`${className} shrink-0 whitespace-nowrap font-mono font-medium leading-none tracking-[0.1em] text-fg-100`}>
                [ AD ]
            </span>
        );
    }
    const logo = LOGOS[org];
    const style = { height: `calc(var(--logo-s) * ${Math.sqrt(logo.h / logo.w).toFixed(3)})` };
    // A lazy image under display:none is never fetched, so a two-variant mark loads both up front or blanks on its first switch.
    const loading = "dark" in logo ? "eager" : "lazy";
    const mark = (src: string, variant = "") => (
        <Image src={src} alt={alt} width={logo.w} height={logo.h} unoptimized loading={loading} style={style} className={`${className} w-auto shrink-0 ${variant}`.trim()} />
    );
    // Both variants ship and CSS shows the one for the mode, so it is right before hydration.
    return "dark" in logo ? <>{mark(logo.src, "dark:hidden")}{mark(logo.dark, "light:hidden")}</> : mark(logo.src);
}
