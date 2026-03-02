#!/bin/bash

# Test Script - AI PDF Question Generation
# This script tests the complete workflow using curl

echo "════════════════════════════════════════"
echo "🧪 AI PDF QUESTION GENERATION TEST"
echo "════════════════════════════════════════"
echo ""

# Configuration
API_URL="http://localhost:8000/api"
TOKEN="${TEST_TOKEN:-your-token-here}"  # Set your auth token here

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📡 Step 1: Checking Backend Connection${NC}"
echo "Endpoint: $API_URL/user"
echo ""

# Test backend connectivity
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/user")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is running and authenticated${NC}"
    echo "Response: $BODY"
    echo ""
else
    echo -e "${RED}❌ Backend connection failed (HTTP $HTTP_CODE)${NC}"
    echo "Make sure:"
    echo "  1. Backend is running: cd BackEnd && php artisan serve"
    echo "  2. Token is correct: export TEST_TOKEN='your-valid-token'"
    echo ""
    exit 1
fi

echo -e "${BLUE}📎 Step 2: Creating Test PDF File${NC}"
echo ""

# Create a simple test PDF content (as text file for now)
PDF_CONTENT="LE SYSTÈME SOLAIRE

Le système solaire est composé du Soleil et de tous les objets célestes qui orbitent autour de lui.

PLANÈTES:
1. MERCURE - La plus petite planète
   Distance: 58 millions km du Soleil
   Température: Entre -173°C et 427°C

2. VÉNUS - La plus chaude
   Distance: 108 millions km du Soleil
   Température: 464°C

3. TERRE - Notre planète
   Distance: 150 millions km du Soleil
   Satellites: 1 (la Lune)

4. MARS - La planète rouge
   Distance: 228 millions km du Soleil
   Satellites: 2 (Phobos et Déimos)

5. JUPITER - La plus grande
   Distance: 778 millions km du Soleil
   Satellites: 95+

6. SATURNE - Anneaux spectaculaires
   Satellites: 146+

7. URANUS - Inclinée
   Distance: 2,87 milliards km

8. NEPTUNE - La plus éloignée
   Distance: 4,5 milliards km"

# For this test, we'll just send the content as text
# In real scenario, create actual PDF with: https://www.php.net/manual/en/book.pdf.php
echo "$PDF_CONTENT" > /tmp/test_solar_system.txt
echo -e "${GREEN}✅ Test content created${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Testing /attachments/process Endpoint${NC}"
echo "Input:"
echo "  - PDF file (multipart)"
echo "  - Links: ['https://nasa.gov/solar-system', 'https://wikipedia.org/solar-system']"
echo ""

# Test with actual PDF would look like:
# curl -X POST "$API_URL/attachments/process" \
#   -H "Authorization: Bearer $TOKEN" \
#   -F "pdf=@/path/to/file.pdf" \
#   -F "links[]=https://nasa.gov" \
#   -F "links[]=https://wikipedia.org"

# For now, show the command (since we don't have actual PDF)
echo -e "${YELLOW}⚠️  Note: To use with real PDF file:${NC}"
echo ""
echo "curl -X POST \"$API_URL/attachments/process\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -F \"pdf=@test-solar-system.pdf\" \\"
echo "  -F \"links[]=https://nasa.gov/solar-system\" \\"
echo "  -F \"links[]=https://wikipedia.org/wiki/Solar_System\""
echo ""

echo -e "${BLUE}📨 Step 4: Testing /generate-questions Endpoint${NC}"
echo "This endpoint will receive the extracted PDF content and links"
echo ""

# Create test payload
PAYLOAD=$(cat <<EOF
{
    "course": "Sciences",
    "topic": "Système Solaire",
    "gameNumber": 1,
    "numLevels": 2,
    "level_types": ["box", "balloon"],
    "ai_prompt": "Generate questions about the solar system, particularly about planets and their characteristics.",
    "pdf_text": "$PDF_CONTENT",
    "links": [
        "https://nasa.gov/solar-system",
        "https://wikipedia.org/wiki/Solar_System"
    ]
}
EOF
)

echo "Sending request..."
echo ""

# Call the API
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$API_URL/generate-questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API call successful (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    
    # Check if response contains expected fields
    if echo "$BODY" | grep -q "levels"; then
        echo -e "${GREEN}✅ Response contains 'levels' - Questions were generated!${NC}"
    fi
else
    echo -e "${RED}❌ API call failed (HTTP $HTTP_CODE)${NC}"
    echo "Response:"
    echo "$BODY"
    echo ""
fi

echo ""
echo -e "${BLUE}🔍 Step 5: Check Backend Logs${NC}"
echo "Run this in another terminal to see detailed logs:"
echo ""
echo "  cd BackEnd"
echo "  tail -f storage/logs/laravel.log"
echo ""
echo "Look for:"
echo "  - 📎 [Attachment] Processing attachments..."
echo "  - 📄 [Attachment] Processing PDF file..."
echo "  - ✅ PDF text extracted"
echo "  - 🔗 [AIQuestion] Adding links to prompt"
echo "  - 🌐 [AIQuestion] Calling Groq API"
echo "  - ✅ [AIQuestion] Successfully generated all levels"
echo ""

echo "════════════════════════════════════════"
echo -e "${GREEN}✅ Test flow complete!${NC}"
echo "════════════════════════════════════════"
echo ""
echo "To verify AI is using PDF content in generated questions:"
echo "  ✓ Questions should mention planets (Mercure, Vénus, Terre, etc.)"
echo "  ✓ Questions should include distances (150 millions km, etc.)"
echo "  ✓ Questions should reference temperatures and characteristics"
echo "  ✓ Questions should relate to solar system content"
echo ""
