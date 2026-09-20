"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Verbatim from langchain-ai/langchain-litellm PR #161 (merged 2026-05-21),
// verified against the GitHub diff API. Not a paraphrase.
const DIFF = `# langchain-litellm — langchain_litellm/chat_models/litellm.py
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

// Per-line colouring rather than a highlighter: the +/- gutter is the whole
// point of showing a diff here, and it has to survive being dimmed.
function DiffLines() {
    return (
        <>
            {DIFF.split("\n").map((line, i) => {
                const cls = line.startsWith("+")
                    ? "text-[#7fd0a3]"
                    : line.startsWith("-")
                        ? "text-[#e08b94]"
                        : line.startsWith("#")
                            ? "text-white/35"
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

    const codeY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-screen overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #07090f 0%, #0d1117 60%, #07090f 100%)', marginBottom: '-1px' }}
            data-theme="dark"
        >
            {/* Background Image Container */}
            <motion.div
                className="absolute inset-0 w-full h-full"
                style={{ y: imageY }}
            >
                {/* Cinematic depth gradient */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top right, #0d1a2e, #07090f, #0a0e15)' }} />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-[rgba(7,9,15,0.5)]" />
            </motion.div>

            {/* Code Overlay */}
            <div className="relative w-full h-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 pt-32 overflow-hidden z-10 pointer-events-none">

                <motion.div
                    style={{ y: codeY }}
                    className="w-full md:w-1/2 opacity-75"
                >
                    <pre className="font-mono text-[0.75rem] leading-relaxed whitespace-pre" style={{ textShadow: "0 0 12px rgba(255,255,255,0.08)" }}>
                        <code><DiffLines /></code>
                    </pre>

                    {/* Doubled so the drift never runs out of content */}
                    <pre className="font-mono text-[0.75rem] leading-relaxed whitespace-pre mt-12" style={{ textShadow: "0 0 12px rgba(255,255,255,0.08)" }}>
                        <code><DiffLines /></code>
                    </pre>
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
