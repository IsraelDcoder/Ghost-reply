#!/bin/bash
# Build script for Render deployment
# Installs all dependencies (including dev) and builds the server

set -e

echo "Installing dependencies..."
npm install

echo "Building server..."
npm run server:build

echo "Build complete!"
