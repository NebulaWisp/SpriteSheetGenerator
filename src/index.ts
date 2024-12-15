import fs from 'fs';
import path from 'path';
import sharp from 'sharp';


// Just testing it here
export async function createSpritesheet(
  inputDir: string,
  outputFile: string,
): Promise<void> {
  try {
    // Read files in the input directory
    const files = fs
      .readdirSync(inputDir)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .sort((a, b) => parseInt(a) - parseInt(b)); // Sort by numerical order

    if (files.length === 0) {
      throw new Error("No image files found in the directory.");
    }

    // Load and process images
    const images = await Promise.all(
      files.map(file => sharp(path.join(inputDir, file)).toBuffer())
    );

    // Determine spritesheet dimensions
    const columns = Math.ceil(Math.sqrt(files.length)); // Square grid layout
    const rows = Math.ceil(files.length / columns);

    const metadataList = await Promise.all(
      files.map(file => sharp(path.join(inputDir, file)).metadata())
    );

    const tileWidths = metadataList.map(meta => meta.width || 0);
    const tileHeights = metadataList.map(meta => meta.height || 0);

    // Spritesheet dimensions
    const spritesheetWidth = tileWidths.reduce((sum, w, i) => sum + w, 0); // sum of widths of all tiles in a row
    const spritesheetHeight = Math.max(...tileHeights); // maximum height of all tiles

    const spritesheet = sharp({
      create: {
        width: spritesheetWidth,
        height: spritesheetHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });

    // Composite images onto the canvas
    let currentX = 0; // Tracks the x position
    let currentY = 0; // Tracks the y position
    let rowHeight = 0; // Tracks the tallest image in the current row

    const compositeImages = files.map((file, index) => {
      const img = images[index]; // Image buffer
      const metadata = metadataList[index]; // Metadata for the image
      const imgWidth = metadata.width || 0;
      const imgHeight = metadata.height || 0;

      // If the image doesn't fit in the current row, move to the next row
      if (currentX + imgWidth > spritesheetWidth) {
        currentX = 0;
        currentY += rowHeight; // Move down by the height of the tallest image in the row
        rowHeight = 0; // Reset rowHeight for the new row
      }

      // Update the row's tallest image
      rowHeight = Math.max(rowHeight, imgHeight);

      const position = { input: img, top: currentY, left: currentX };

      // Move to the next position in the row
      currentX += imgWidth;

      return position;
    });


    await spritesheet.composite(compositeImages).toFile(outputFile);

    console.log(`Spritesheet saved to ${outputFile}`);
  } catch (error: any) {
    console.error("Error creating spritesheet:", error?.message ?? 'unknown error');
  }
}

// Example usage
const inputDirectory = path.resolve(__dirname, "../images");
const outputFilePath = path.resolve(__dirname, "../dist/output/spritesheet.png");
const tileWidth = 64; // Adjust as needed
const tileHeight = 64; // Adjust as needed

// createSpritesheet(inputDirectory, outputFilePath, tileWidth, tileHeight);
