import { ImageResponse } from "next/og";

// Generated at build time rather than shipped as a binary, so the card cannot
// drift from the design tokens the way a hand-exported PNG would.
export const alt = "Akshay Dongare, AI Platform Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pinned so the build is reproducible. Wrapped in a fallback below: if the CDN
// is unreachable the card still renders in ImageResponse's default face rather
// than failing the build.
const GEIST_TTF =
    "https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-Regular.ttf";

async function loadGeist(): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(GEIST_TTF);
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch {
        return null;
    }
}

const CHIPS = [
    "15M DOWNLOADS",
    "1M+ EVERY MONTH",
    "MAINTAINED IN THE LANGCHAIN ORG",
];

export default async function OpengraphImage() {
    const geist = await loadGeist();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "68px 76px",
                    backgroundColor: "#0d1117",
                    backgroundImage:
                        "linear-gradient(135deg, #07090f 0%, #0d1117 55%, #0a0e15 100%)",
                    ...(geist ? { fontFamily: "Geist" } : {}),
                }}
            >
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            fontSize: 24,
                            letterSpacing: "0.2em",
                            color: "rgba(255,255,255,0.88)",
                        }}
                    >
                        [ AD ]
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 20,
                            letterSpacing: "0.14em",
                            color: "rgba(255,255,255,0.45)",
                        }}
                    >
                        AKSHAYDONGARE.COM
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 21,
                            letterSpacing: "0.22em",
                            color: "#6b9fd4",
                            marginBottom: 30,
                        }}
                    >
                        AI PLATFORM ENGINEER
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 66,
                            lineHeight: 1.12,
                            letterSpacing: "-0.02em",
                            color: "#ffffff",
                            maxWidth: 940,
                        }}
                    >
                        I build the layer between your application and the model.
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    {CHIPS.map((chip, i) => (
                        <div
                            key={chip}
                            style={{
                                display: "flex",
                                fontSize: 17,
                                letterSpacing: "0.1em",
                                color: "rgba(255,255,255,0.58)",
                                border: "1px solid rgba(255,255,255,0.14)",
                                borderRadius: 4,
                                padding: "11px 18px",
                                marginRight: i < CHIPS.length - 1 ? 14 : 0,
                            }}
                        >
                            {chip}
                        </div>
                    ))}
                </div>
            </div>
        ),
        {
            ...size,
            ...(geist
                ? {
                    fonts: [
                        { name: "Geist", data: geist, style: "normal" as const, weight: 400 as const },
                    ],
                }
                : {}),
        }
    );
}
