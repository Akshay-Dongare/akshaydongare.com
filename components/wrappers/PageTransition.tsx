"use client";

import { m } from "framer-motion";

// app/template.tsx remounts this on every navigation, so each page fades and slides in from its initial state and
// the old page simply leaves. An AnimatePresence exit here would never run, so there is none.
export default function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-full min-h-screen"
        >
            {children}
        </m.div>
    );
}
