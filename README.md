# StrainSpotter - Cannabis Strain Identifier

StrainSpotter is an advanced mobile application that uses AI to identify cannabis strains from photos of plants and buds. The app provides detailed information about each strain, including growing guides, effects, medical uses, and where to buy seeds.

## Features

- **Visual Strain Identification**: Take a photo of cannabis plants or buds to identify the strain
- **OCR Text Recognition**: Identify strains from text on packaging
- **Comprehensive Strain Database**: Detailed information on popular cannabis strains
- **Growing Guides**: Specific cultivation information for each strain
- **Indica/Sativa Ratio Visualization**: Visual representation of strain genetics
- **Seed Source Links**: Find where to buy seeds for identified strains
- **Personal Gallery**: Build your own reference library of labeled cannabis photos

## Getting Started

### Quick Start

The easiest way to run StrainSpotter is using the included run script:

```bash
./run-app.sh
```

This script provides options to:
1. Run the Web App
2. Run the iOS App
3. Run Tests

### Running the iOS App

To run the iOS app on your Mac:

1. Make sure you have Xcode installed
2. Build the web assets and copy to iOS:
   ```bash
   npm run build
   npx cap copy ios
   ```
3. Open the Xcode project:
   ```bash
   npx cap open ios
   ```
4. Or use the included script:
   ```bash
   ./run-ios.sh
   ```

### Running the Web App

For development and testing, you can run the web version:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

## Enhanced Image Matching

StrainSpotter uses advanced image processing techniques to accurately match cannabis plants and buds:

1. **Multi-Feature Analysis**: Analyzes color, texture, and shape characteristics
2. **Cannabis-Specific Algorithms**: Optimized for identifying cannabis plant features
3. **Hybrid Identification**: Combines visual matching with OCR text recognition
4. **Confidence Scoring**: Provides confidence levels for each match

## Using the App

1. **Age Verification**: Confirm you're 21 or older
2. **Classify Photos**: Upload images of cannabis plants or buds to identify strains
3. **Gallery Management**: Build your reference library of labeled cannabis photos
4. **Strain Database**: Browse the comprehensive strain database
5. **Growing Guide**: Access cultivation information for different strains

## Development

### Project Structure

- `src/` - React components and application code
- `public/` - Static assets and data files
- `ios/` - iOS application files
- `dist/` - Built web assets

### Key Files

- `src/StrainSpotterApp.jsx` - Main application component
- `src/ai.js` - AI and image processing functionality
- `src/ocr.js` - OCR text recognition
- `src/data/strainDatabase.js` - Strain database integration
- `src/enhancedImageMatching.js` - Advanced image matching algorithms
- `public/data/expanded-strains.json` - Comprehensive strain database

### Building for Production

To build the app for production:

```bash
npm run build
```

For iOS:

```bash
npm run build
npx cap copy ios
npx cap open ios
```

Then use Xcode to build and deploy the app.
