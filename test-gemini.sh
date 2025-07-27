#!/bin/bash

# Test the Gemini API route with curl
# Make sure your Next.js server is running on localhost:3000

echo "🧪 Testing Gemini API with curl..."

curl -X POST http://localhost:3000/api/generate-theme \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "Space Adventures", 
    "roomCode": "CURL123"
  }' \
  -v

echo ""
echo "✅ Test complete! Check the server logs for detailed debugging info."
