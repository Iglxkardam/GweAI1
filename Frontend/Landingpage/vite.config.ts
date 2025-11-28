import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better DX
      fastRefresh: true,
      // Babel optimizations
      babel: {
        plugins: [
          // Add any babel plugins here if needed
        ],
      },
    }),
  ],
  // Critical: Resolve React to single instance to prevent hook errors
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
    },
  },
  build: {
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching (optimized for 100k+ users)
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'animation-vendor': ['framer-motion'],
          'three-vendor': ['three'],
          'web3-vendor': ['viem', 'wagmi'],
          'dynamic-vendor': ['@dynamic-labs/sdk-react-core', '@dynamic-labs/ethereum'],
          'query-vendor': ['@tanstack/react-query'],
          'icons-vendor': ['react-icons'],
          'utils-vendor': ['axios', 'groq-sdk'],
        },
        // Optimize asset naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
      }
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Run compression twice for smaller output
      },
      mangle: {
        safari10: true, // Better Safari compatibility
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Optimize chunk size (increased for better code splitting)
    chunkSizeWarningLimit: 800,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps for production debugging (disable for smaller build)
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: true,
    // Optimize asset inlining
    assetsInlineLimit: 4096, // Inline assets < 4kb
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'react/jsx-runtime',
    ],
    exclude: ['@abstract-foundation/agw-client'],
    // Ensure single React instance
    esbuildOptions: {
      resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
      mainFields: ['module', 'main'],
    },
  },
  // Performance improvements
  server: {
    port: 5183,
    strictPort: false,
    hmr: {
      overlay: false
    },
    // Enable compression
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
  },
  // Define environment variables
  define: {
    // Replace process.env checks with literals for better tree-shaking
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
})
