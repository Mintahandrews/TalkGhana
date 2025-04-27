#!/bin/bash

# Color definitions for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TalkGhana Cleanup Script ===${NC}"
echo -e "${BLUE}This script will remove unrelated files and folders from the TalkGhana project.${NC}"
echo

# Ask for confirmation before proceeding
echo -e "${YELLOW}This will delete files and folders. Are you sure you want to continue? (y/n)${NC}"
read -r confirmation
if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
    echo -e "${RED}Operation cancelled.${NC}"
    exit 0
fi

# List of temporary fix scripts to delete
echo -e "${YELLOW}Removing temporary fix scripts...${NC}"
temp_scripts=(
    "fix-conversation-error.js"
    "fix-conversation-scrollToBottom.js"
    "fix-env-errors.sh"
    "fix-extension-errors.js"
    "fix-extension-instructions.html"
    "fix-layout-error.js"
    "fix-responsive-design.sh"
    "open-instructions.sh"
)

for script in "${temp_scripts[@]}"; do
    if [ -f "$script" ]; then
        rm "$script"
        echo -e "  ${GREEN}Deleted: $script${NC}"
    else
        echo -e "  ${YELLOW}Not found: $script${NC}"
    fi
done

# Removing empty directories
echo -e "\n${YELLOW}Removing empty directories...${NC}"
empty_dirs=(
    "temp"
    "logs"
)

for dir in "${empty_dirs[@]}"; do
    if [ -d "$dir" ] && [ -z "$(ls -A "$dir")" ]; then
        rmdir "$dir"
        echo -e "  ${GREEN}Deleted empty directory: $dir${NC}"
    elif [ -d "$dir" ]; then
        echo -e "  ${YELLOW}Directory not empty, skipping: $dir${NC}"
    else
        echo -e "  ${YELLOW}Not found: $dir${NC}"
    fi
done

# Clean up the uploads directory (keeping the structure but removing temp files)
echo -e "\n${YELLOW}Cleaning uploads directory...${NC}"
if [ -d "uploads" ]; then
    find uploads -type f -name "*.tmp" -delete
    echo -e "  ${GREEN}Removed temporary files from uploads directory${NC}"
    
    # Keep the directory structure but delete old audio files (older than 7 days)
    if [ -d "uploads/audio" ]; then
        find uploads/audio -type f -mtime +7 -delete
        echo -e "  ${GREEN}Removed old audio files from uploads/audio${NC}"
    fi
else
    echo -e "  ${YELLOW}Uploads directory not found${NC}"
fi

# Cleanup build artifacts and temporary files
echo -e "\n${YELLOW}Cleaning build artifacts and temporary files...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "  ${GREEN}Removed dist directory${NC}"
fi

if [ -f "tsconfig.tsbuildinfo" ]; then
    rm tsconfig.tsbuildinfo
    echo -e "  ${GREEN}Removed tsconfig.tsbuildinfo${NC}"
fi

# Clean up node_modules (optional)
echo -e "\n${YELLOW}Do you want to remove node_modules? This will require running 'npm install' again. (y/n)${NC}"
read -r clean_modules
if [[ "$clean_modules" == "y" || "$clean_modules" == "Y" ]]; then
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        echo -e "  ${GREEN}Removed node_modules directory${NC}"
        echo -e "  ${YELLOW}Remember to run 'npm install' before starting the application${NC}"
    else
        echo -e "  ${YELLOW}node_modules directory not found${NC}"
    fi
fi

echo -e "\n${GREEN}Cleanup completed!${NC}"
echo -e "${BLUE}Your TalkGhana project has been cleaned up.${NC}"
echo

exit 0 