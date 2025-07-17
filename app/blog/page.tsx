import React from "react";

export default function BlogPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
      <h1 className="text-4xl font-Mono font-bold text-lightblue mb-4">Blog</h1>
      <p className="max-w-2xl text-lg text-lightgray text-center mb-8">
        [Placeholder] My thoughts, tutorials, and stories will appear here soon. Stay tuned for updates!
      </p>
      <div className="w-full max-w-3xl space-y-6">
        {/* Blog posts will be listed here */}
      </div>
    </main>
  );
} 