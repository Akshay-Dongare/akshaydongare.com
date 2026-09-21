"use client";

import React from "react";
import { motion } from "framer-motion";

export function PrivacyContent() {
    return (
        <div
            className="star-masthead w-full min-h-screen pt-32 pb-24"
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #07090f 100%)' }}
            data-theme="dark"
        >
            <div className="max-w-[1000px] mx-auto px-6 md:px-12 lg:px-20">

                <motion.h1
                    className="text-display-xl text-white/90 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    Privacy Policy
                </motion.h1>

                <motion.div
                    className="max-w-none text-body text-white/65 leading-relaxed space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <p>
                        This is my personal portfolio and playground. I don&apos;t believe in invasive tracking, unnecessary cookies, or monetizing your attention.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-white/85">Data Collection</h2>
                    <p>
                        I do not actively collect personal data. Any basic analytics I might use are strictly for understanding broad traffic patterns (e.g., page views) and do not track individual user identities. No third-party ad networks or invasive trackers are installed here.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-white/85">Communication</h2>
                    <p>
                        If you reach out via email or social media, I will keep your communication private and use it solely to respond to your inquiry. Your email address will never be sold, shared, or added to any mailing list without your explicit consent.
                    </p>

                    <h2 className="text-display-m mt-16 mb-4 text-white/85">External Links</h2>
                    <p>
                        This site contains links to other websites (like GitHub and LinkedIn). Once you leave this site, my privacy policy no longer applies. I encourage you to read the privacy statements of any other site you visit.
                    </p>

                    <p className="mt-16 text-white/50 font-mono text-sm">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </motion.div>

            </div>
        </div>
    );
}
