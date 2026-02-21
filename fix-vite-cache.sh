#!/bin/bash
echo "Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf dist
echo "Cache cleared. Please restart your dev server with: npm run dev"
