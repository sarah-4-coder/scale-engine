/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defineConfig } from "vite";
//@ts-ignore
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster builds and better performance
      //@ts-ignore
      jsxRuntime: "automatic",
      // Enable Fast Refresh
      fastRefresh: true,
      // Babel plugins if needed
      babel: {
        plugins: [
          // Add any babel plugins here if needed
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },

  // ============================================
  // BUILD OPTIMIZATIONS
  // ============================================
  build: {
    // Output directory
    outDir: "dist",

    // Generate sourcemaps for debugging (disable in production for smaller size)
    sourcemap: false,

    // Target modern browsers for better optimization
    target: "esnext",

    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      format: {
        // Remove comments
        comments: false,
      },
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Chunk size warning limit (in kB)
    chunkSizeWarningLimit: 1000,

    // ============================================
    // ROLLUP OPTIONS - CODE SPLITTING
    // ============================================
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            // Supabase
            if (id.includes("@supabase")) {
              return "supabase-vendor";
            }

            // React Query
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }

            // UI libraries
            if (id.includes("framer-motion")) {
              return "motion-vendor";
            }

            if (id.includes("lucide-react")) {
              return "icons-vendor";
            }

            // All other node_modules
            return "vendor";
          }

          // Split by route
          if (id.includes("/pages/admin/")) {
            return "admin";
          }

          if (id.includes("/pages/influencer/")) {
            return "influencer";
          }
        },

        // Naming pattern for chunks
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },

    // ============================================
    // ASSET OPTIMIZATION
    // ============================================
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb

    // CSS optimization
    cssMinify: true,
  },

  // ============================================
  // DEVELOPMENT SERVER
  // ============================================
  server: {
    port: 5173,
    strictPort: false,

    // Hot Module Replacement
    hmr: {
      overlay: false, // Less intrusive error overlay
    },

    // Optimize deps on server start
    warmup: {
      clientFiles: ["./src/App.tsx", "./src/main.tsx"],
    },
  },

  // ============================================
  // PREVIEW SERVER (for testing production build)
  // ============================================
  preview: {
    port: 4173,
    strictPort: false,
  },

  // ============================================
  // DEPENDENCY OPTIMIZATION
  // ============================================
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server startup
    include: [
      "react-router-dom",
      "framer-motion",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "lucide-react",
    ],

    // Exclude large dependencies that don't need pre-bundling
    exclude: [
      // Add any deps that should not be pre-bundled
    ],
  },

  // ============================================
  // PERFORMANCE HINTS
  // ============================================

  // Enable esbuild for faster builds
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],

    // Minify identifiers for smaller bundle
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
});
