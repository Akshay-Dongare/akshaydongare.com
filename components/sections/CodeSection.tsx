"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";

// The /files view is the diff itself rather than the conversation, which is what
// the section is showing. Verified: this PR changed exactly the two files quoted
// below — litellm.py (+2/-25) and test_litellm.py (+38/-8).
const PR_URL = "https://github.com/langchain-ai/langchain-litellm/pull/161/files";

// Verbatim from langchain-ai/langchain-litellm PR #161 (merged 2026-05-21),
// verified against the GitHub diff API. Not a paraphrase.
const DIFF = `# langchain-litellm · langchain_litellm/chat_models/litellm.py
# PR #161  remove global litellm module mutations from _client_params

     @property
     def _client_params(self) -> Dict[str, Any]:
-        """Get the parameters used for the openai client."""
-        set_model_value = self.model
-        if self.model_name is not None:
-            set_model_value = self.model_name
-        self.client.api_base = self.api_base
-        self.client.api_key = self.api_key
-        for named_api_key in [
-            "openai_api_key",
-            "azure_api_key",
-            "anthropic_api_key",
-            "replicate_api_key",
-            "cohere_api_key",
-            "openrouter_api_key",
-        ]:
-            if api_key_value := getattr(self, named_api_key):
-                setattr(
-                    self.client,
-                    named_api_key.replace("_api_key", "_key"),
-                    api_key_value,
-                )
-        self.client.organization = self.organization
+        """Get the parameters used for the OpenAI client."""
         creds: Dict[str, Any] = {
-            "model": set_model_value,
             "timeout": self.request_timeout,
             "api_base": self.api_base,
             "api_key": self.api_key,
+            "organization": self.organization,
         }
-        # Forward any extra headers to the client and include in params
         if self.extra_headers is not None:
-            # set attribute on client for runtime usage
-            setattr(self.client, "extra_headers", self.extra_headers)
             creds["extra_headers"] = self.extra_headers
         return {**self._default_params, **creds}
`;

// Second hunk of the same PR: the regression test. Shown instead of
// repeating the fix, which is what the old placeholder sample did.
const TEST = `# and the test that keeps it fixed
# tests/unit_tests/test_litellm.py

+def test_client_params_does_not_mutate_litellm_globals() -> None:
+    """_client_params must not write instance config to litellm module globals. Fixes #132."""
+    before = {
+        "api_base": litellm.api_base,
+        "api_key": litellm.api_key,
+        "organization": getattr(litellm, "organization", None),
+    }
+
+    llm = ChatLiteLLM(
+        model="azure/gpt-4o",
+        api_base="https://my-azure.openai.azure.com",
+        api_key="azure-key",
+        organization="my-org",
+        extra_headers={"X-Custom": "value"},
+    )
+    params = llm._client_params
+
+    # globals must be untouched
+    assert litellm.api_base == before["api_base"]
+    assert litellm.api_key == before["api_key"]
+    assert getattr(litellm, "organization", None) == before["organization"]
+
+    # values must be present in the returned per-call params instead
+    assert params["api_base"] == "https://my-azure.openai.azure.com"
+    assert params["api_key"] == "azure-key"
+    assert params["organization"] == "my-org"
+    assert params["extra_headers"] == {"X-Custom": "value"}
`;

// Per-line colouring rather than a highlighter: the +/- gutter is the whole
// point of showing a diff here, and it has to survive being dimmed.
function DiffLines({ source }: { source: string }) {
    return (
        <>
            {source.split("\n").map((line, i) => {
                const cls = line.startsWith("+")
                    ? "text-[#7fd0a3]"
                    : line.startsWith("-")
                        ? "text-[#e08b94]"
                        : line.startsWith("#")
                            ? "text-white/50"
                            : "text-white/55";
                return (
                    <div key={i} className={cls}>
                        {line || "\u00A0"}
                    </div>
                );
            })}
        </>
    );
}

export function CodeSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Slower upward drift for code
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    // MotionConfig reducedMotion="user" covers animate/whileInView, but NOT a
    // MotionValue driven by scroll: that is a computed value, not an animation, so
    // Framer has nothing to opt out of. Collapsing the output range is the opt-out.
    const reduced = !!useReducedMotion();
    const codeY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "-30%"]);
    // Pixels, not percent. As a percentage this was 20% of the layer's OWN height, so
    // sizing the bleed needed to hide its edges meant solving a percentage of a
    // percentage. In px the guarantee is arithmetic: travel 140, bleed 200, never shows.
    const imageY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 140]);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-svh overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #07090f 0%, #0d1117 50%, #07090f 100%)', marginBottom: '-1px' }}
            data-theme="dark"
        >
            {/* Static masked wrapper. The mask is anchored to the SECTION, not to the layer
                that moves inside it, so the top and bottom 12% always resolve to the
                section's own background, which begins and ends on --blend-void. That is
                what makes both joints seamless: MissionSection ends on void above and
                ContactSection opens on void below. */}
            <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%)',
                }}
            >
                {/* Bled 200px past both edges against 140px of travel, so this layer's own
                    edges are never inside the wrapper. Before, it was inset-0 and shifted
                    down, which put its top edge 20% into the section as a hard line across
                    the full width. */}
                <motion.div
                    className="absolute inset-x-0"
                    style={{ y: imageY, top: '-200px', height: 'calc(100% + 400px)' }}
                >
                    {/* Cinematic depth gradient */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top right, #0d1a2e, #07090f, #0a0e15)' }} />

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-[rgba(7,9,15,0.5)]" />
                </motion.div>
            </div>

            {/* Code Overlay */}
            <div className="relative w-full h-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 pt-32 overflow-hidden z-10 pointer-events-none">

                <motion.div
                    style={{ y: codeY }}
                    className="w-full md:w-1/2"
                >
                    <Link
                        href={PR_URL}
                        aria-label="Read pull request 161 on GitHub: remove global litellm module mutations from _client_params"
                        className="group block pointer-events-auto cursor-none"
                    >
                        {/* Visible at rest rather than on hover: touch has no hover, and the
                            code has to look clickable before anyone taps it. */}
                        <span className="mb-5 flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.15em] uppercase text-white/55 group-hover:text-white/90 transition-colors">
                            Read this diff on GitHub
                            <span aria-hidden="true" className="shrink-0 whitespace-nowrap text-white/55 group-hover:text-white/90 transition-colors">[ &rarr; ]</span>
                        </span>
                    <pre className="font-mono text-[0.75rem] leading-relaxed whitespace-pre max-md:overflow-x-auto max-md:overscroll-x-contain max-md:pointer-events-auto max-md:-mx-6 max-md:px-6" style={{ textShadow: "0 0 12px rgba(255,255,255,0.08)" }}>
                        <code className="block w-max"><DiffLines source={DIFF} /></code>
                    </pre>

                    {/* Second hunk of the same PR, not a repeat of the first */}
                    <pre className="font-mono text-[0.75rem] leading-relaxed whitespace-pre mt-12 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:pointer-events-auto max-md:-mx-6 max-md:px-6" style={{ textShadow: "0 0 12px rgba(255,255,255,0.08)" }}>
                        <code className="block w-max"><DiffLines source={TEST} /></code>
                    </pre>
                    </Link>
                </motion.div>

                {/* Dramatic silhouette element lower right */}
                <motion.div
                    className="absolute bottom-[15%] right-[10%] w-[200px] h-[300px] opacity-40 mix-blend-screen"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.4 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.14 }}
                >
                    <div className="w-full h-full bg-gradient-to-t from-[rgba(255,255,255,0.1)] to-transparent blur-3xl rounded-[100%]" />
                </motion.div>
            </div>

        </section>
    );
}
