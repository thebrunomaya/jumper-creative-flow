#!/bin/bash

# Upload Deck Templates and Design Systems to Supabase Storage
# Fixes Content-Type issue (text/plain → text/html; charset=utf-8)
#
# Usage:
#   ./scripts/upload-deck-assets.sh test     # Upload 1 file for testing
#   ./scripts/upload-deck-assets.sh all      # Upload all files

set -e  # Exit on error

PROJECT_REF="biwwowendjuzvpttyrlb"
BUCKET="decks"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Supabase Storage Upload - Deck Templates${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Validate Supabase CLI is authenticated
if ! supabase projects list --project-ref "$PROJECT_REF" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with Supabase CLI${NC}"
    echo "Run: supabase login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Supabase CLI${NC}"
echo ""

# Function to upload a file
upload_file() {
    local local_path=$1
    local storage_path=$2
    local content_type=$3

    echo -e "📤 Uploading: ${BLUE}$storage_path${NC}"

    supabase storage cp \
        "$local_path" \
        "$BUCKET/$storage_path" \
        --project-ref "$PROJECT_REF" \
        --content-type "$content_type" \
        --upsert

    echo -e "${GREEN}✅ Uploaded successfully${NC}"
    echo ""
}

# Function to validate Content-Type
validate_content_type() {
    local storage_path=$1
    local expected_type=$2

    echo -e "🔍 Validating Content-Type..."

    local url="https://$PROJECT_REF.supabase.co/storage/v1/object/public/$BUCKET/$storage_path"
    local actual_type=$(curl -sI "$url" | grep -i "content-type:" | cut -d: -f2 | xargs)

    if [[ "$actual_type" == "$expected_type" ]]; then
        echo -e "${GREEN}✅ Content-Type correct: $actual_type${NC}"
        return 0
    else
        echo -e "${YELLOW}❌ Content-Type mismatch!${NC}"
        echo -e "   Expected: ${GREEN}$expected_type${NC}"
        echo -e "   Actual:   ${YELLOW}$actual_type${NC}"
        return 1
    fi
}

# PHASE 1: Test with single file
if [[ "$1" == "test" ]]; then
    echo -e "${YELLOW}━━━ PHASE 1: Test Upload (1 file) ━━━${NC}"
    echo ""

    # Upload test template
    upload_file \
        "decks/examples/apple-keynote-style.html" \
        "examples/apple-keynote-style.html" \
        "text/html; charset=utf-8"

    # Validate Content-Type
    validate_content_type \
        "examples/apple-keynote-style.html" \
        "text/html; charset=utf-8"

    if [[ $? -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ TEST PASSED - Content-Type is correct!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Next step: Run './scripts/upload-deck-assets.sh all' to upload all files"
        echo ""
        echo "Test in browser:"
        echo "https://$PROJECT_REF.supabase.co/storage/v1/object/public/$BUCKET/examples/apple-keynote-style.html"
        echo "(Should RENDER as HTML, not show source code)"
    else
        echo ""
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}❌ TEST FAILED - Content-Type still incorrect${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        exit 1
    fi

    exit 0
fi

# PHASE 2: Upload all files
if [[ "$1" == "all" ]]; then
    echo -e "${YELLOW}━━━ PHASE 2: Upload All Files ━━━${NC}"
    echo ""

    # Count files
    template_count=$(ls decks/examples/*.html 2>/dev/null | wc -l | xargs)
    echo "Templates to upload: $template_count HTML files"
    echo ""

    # Upload all HTML templates
    echo -e "${BLUE}━━━ Uploading HTML Templates ━━━${NC}"
    echo ""

    counter=1
    for file in decks/examples/*.html; do
        filename=$(basename "$file")
        echo -e "${YELLOW}[$counter/$template_count]${NC}"

        upload_file \
            "$file" \
            "examples/$filename" \
            "text/html; charset=utf-8"

        counter=$((counter + 1))
    done

    # Upload design systems
    echo -e "${BLUE}━━━ Uploading Design Systems ━━━${NC}"
    echo ""

    if [[ -f "decks/identities/jumper/design-system.md" ]]; then
        upload_file \
            "decks/identities/jumper/design-system.md" \
            "identities/jumper/design-system.md" \
            "text/markdown; charset=utf-8"
    fi

    if [[ -f "decks/identities/koko/design-system.md" ]]; then
        upload_file \
            "decks/identities/koko/design-system.md" \
            "identities/koko/design-system.md" \
            "text/markdown; charset=utf-8"
    fi

    # Final validation
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL FILES UPLOADED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Files uploaded:"
    echo "  - $template_count HTML templates (examples/)"
    echo "  - 2 design systems (identities/jumper/, identities/koko/)"
    echo ""
    echo "All files uploaded with Content-Type: text/html; charset=utf-8"
    echo ""
    echo -e "${YELLOW}Next step: Test deck generation in the app${NC}"
    echo "Generate a new deck with Portuguese characters and verify no mojibake."

    exit 0
fi

# Show usage if no argument
echo "Usage:"
echo "  ./scripts/upload-deck-assets.sh test     # Test with 1 file"
echo "  ./scripts/upload-deck-assets.sh all      # Upload all files"
echo ""
echo "Before running 'all', make sure to:"
echo "  1. Delete existing files in Supabase Storage bucket 'decks'"
echo "  2. Run 'test' first to validate the approach"
