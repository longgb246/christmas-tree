#!/bin/bash

# Christmas Tree Project Deployment Script
# This script builds the project and deploys it to a remote server via SCP

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONFIG_FILE="deploy.config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file '$CONFIG_FILE' not found!${NC}"
    echo -e "${YELLOW}Please copy 'deploy.config.example.json' to '$CONFIG_FILE' and configure it.${NC}"
    exit 1
fi

# Parse JSON without jq (using grep and sed)
SERVER_HOST=$(grep -o '"host"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)".*/\1/')
SERVER_USER=$(grep -o '"user"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)".*/\1/')
SERVER_PORT=$(grep -o '"port"[[:space:]]*:[[:space:]]*[0-9]*' "$CONFIG_FILE" | sed 's/.*:[[:space:]]*\([0-9]*\).*/\1/')
REMOTE_PATH=$(grep -o '"remotePath"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)".*/\1/')
OUTPUT_DIR=$(grep -o '"outputDir"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)".*/\1/')
ARCHIVE_NAME=$(grep -o '"archiveName"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)".*/\1/')

if [ "$SERVER_HOST" = "your-server.com" ] || [ "$SERVER_HOST" = "null" ]; then
    echo -e "${RED}Error: Please configure server host in '$CONFIG_FILE'${NC}"
    exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Server: ${GREEN}$SERVER_USER@$SERVER_HOST:$SERVER_PORT${NC}"
echo -e "  Remote Path: ${GREEN}$REMOTE_PATH${NC}"
echo -e "  Archive: ${GREEN}$ARCHIVE_NAME${NC}"
echo ""

echo -e "${YELLOW}[1/5] Cleaning previous build...${NC}"
if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
    echo -e "${GREEN}✓ Cleaned $OUTPUT_DIR${NC}"
fi
if [ -f "$ARCHIVE_NAME" ]; then
    rm -f "$ARCHIVE_NAME"
    echo -e "${GREEN}✓ Removed old archive${NC}"
fi
echo ""

echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}[3/5] Building project...${NC}"
npm run build
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}Error: Build failed, '$OUTPUT_DIR' directory not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

echo -e "${YELLOW}[4/5] Creating archive...${NC}"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

cp -r "$OUTPUT_DIR" "$TEMP_DIR/"
[ -f "package.json" ] && cp package.json "$TEMP_DIR/"

cd "$TEMP_DIR"
tar -czf "$ARCHIVE_NAME" *
cd - > /dev/null

mv "$TEMP_DIR/$ARCHIVE_NAME" .
echo -e "${GREEN}✓ Archive created: $ARCHIVE_NAME ($(du -h "$ARCHIVE_NAME" | cut -f1))${NC}"
echo ""

echo -e "${YELLOW}[5/5] Uploading to server...${NC}"
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" "mkdir -p $REMOTE_PATH"
scp -P "$SERVER_PORT" "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Upload successful${NC}"
else
    echo -e "${RED}✗ Upload failed${NC}"
    exit 1
fi

# echo -e "\n${YELLOW}Extract on server? (y/n)${NC}"
# read -r EXTRACT_CHOICE
EXTRACT_CHOICE="y"

if [ "$EXTRACT_CHOICE" = "y" ] || [ "$EXTRACT_CHOICE" = "Y" ]; then
    echo -e "${YELLOW}Extracting files on server...${NC}"
    ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_HOST" << EOF
        cd ${REMOTE_PATH}
        tar -xzf ${ARCHIVE_NAME}
        rm ${ARCHIVE_NAME}
        echo "Extraction completed"
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Server extraction successful${NC}"
    else
        echo -e "${RED}✗ Server extraction failed${NC}"
        exit 1
    fi
fi

# echo -e "\n${YELLOW}Delete local archive? (y/n)${NC}"
# read -r CLEAN_CHOICE
CLEAN_CHOICE="y"

if [ "$CLEAN_CHOICE" = "y" ] || [ "$CLEAN_CHOICE" = "Y" ]; then
    rm "$ARCHIVE_NAME"
    echo -e "${GREEN}✓ Local archive deleted${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Access URL: http://${SERVER_HOST}${NC}"
