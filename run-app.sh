#!/bin/bash

# StrainSpotter App Runner
# This script provides an easy way to run the StrainSpotter app

# Set text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}       StrainSpotter App Runner         ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to run web version
run_web() {
  echo -e "${BLUE}Starting StrainSpotter web app...${NC}"
  echo -e "${YELLOW}Building the app...${NC}"
  npm run build
  
  echo -e "${YELLOW}Starting development server...${NC}"
  npm run dev &
  DEV_PID=$!
  
  # Wait for server to start
  sleep 3
  
  echo -e "${GREEN}StrainSpotter web app is running!${NC}"
  echo -e "${BLUE}You can access it at: ${YELLOW}http://localhost:5173${NC}"
  echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
  
  # Wait for user to press Ctrl+C
  trap "kill $DEV_PID; echo -e '${RED}Stopping server...${NC}'; exit 0" INT
  wait $DEV_PID
}

# Function to run iOS version
run_ios() {
  echo -e "${BLUE}Preparing StrainSpotter iOS app...${NC}"
  
  # Check if running on macOS
  if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}Error: iOS build can only be run on macOS.${NC}"
    echo -e "${YELLOW}Would you like to run the web version instead? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
      run_web
    else
      echo -e "${RED}Exiting...${NC}"
      exit 1
    fi
    return
  fi
  
  # Check if Xcode is installed
  if ! command_exists xcodebuild; then
    echo -e "${RED}Error: Xcode is not installed.${NC}"
    echo -e "${YELLOW}Please install Xcode from the App Store and try again.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Building the app...${NC}"
  npm run build
  
  echo -e "${YELLOW}Copying web assets to iOS project...${NC}"
  npx cap copy ios
  
  echo -e "${GREEN}iOS project is ready!${NC}"
  echo -e "${BLUE}Choose an option:${NC}"
  echo -e "${YELLOW}1. Open in Xcode${NC}"
  echo -e "${YELLOW}2. Run in iOS Simulator${NC}"
  echo -e "${YELLOW}3. Cancel${NC}"
  
  read -r choice
  
  case $choice in
    1)
      echo -e "${BLUE}Opening project in Xcode...${NC}"
      npx cap open ios
      ;;
    2)
      echo -e "${BLUE}Running in iOS Simulator...${NC}"
      if [ -f "./run-ios.sh" ]; then
        chmod +x ./run-ios.sh
        ./run-ios.sh
      else
        echo -e "${RED}Error: run-ios.sh script not found.${NC}"
        echo -e "${YELLOW}Opening in Xcode instead...${NC}"
        npx cap open ios
      fi
      ;;
    *)
      echo -e "${RED}Cancelled.${NC}"
      ;;
  esac
}

# Function to run tests
run_tests() {
  echo -e "${BLUE}Running StrainSpotter tests...${NC}"
  
  # Create a simple test runner
  echo -e "${YELLOW}Creating test runner...${NC}"
  cat > test-runner.js << 'EOF'
const { runTests } = require('./src/testApp');

console.log('Starting StrainSpotter tests...');
runTests().then(() => {
  console.log('Tests completed!');
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
EOF
  
  echo -e "${YELLOW}Executing tests...${NC}"
  node test-runner.js
  
  # Clean up
  rm test-runner.js
}

# Main menu
echo -e "${BLUE}Choose an option:${NC}"
echo -e "${YELLOW}1. Run Web App${NC}"
echo -e "${YELLOW}2. Run iOS App${NC}"
echo -e "${YELLOW}3. Run Tests${NC}"
echo -e "${YELLOW}4. Exit${NC}"

read -r choice

case $choice in
  1)
    run_web
    ;;
  2)
    run_ios
    ;;
  3)
    run_tests
    ;;
  *)
    echo -e "${RED}Exiting...${NC}"
    exit 0
    ;;
esac