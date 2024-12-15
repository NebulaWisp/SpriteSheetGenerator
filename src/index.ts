import fs from 'fs';
import path from 'path';
import sharp from 'sharp';


// Just testing it here
async function createSpritesheet(
  inputDir: string,
  outputFile: string,
  tileWidth: number,
  tileHeight: number
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
      files.map(file => sharp(path.join(inputDir, file)).resize(tileWidth, tileHeight).toBuffer())
    );

    // Determine spritesheet dimensions
    const columns = Math.ceil(Math.sqrt(files.length)); // Square grid layout
    const rows = Math.ceil(files.length / columns);

    // Create spritesheet canvas
    const spritesheetWidth = columns * tileWidth;
    const spritesheetHeight = rows * tileHeight;

    const spritesheet = sharp({
      create: {
        width: spritesheetWidth,
        height: spritesheetHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });

    // Composite images onto the canvas
    const compositeImages = images.map((img, index) => {
      const x = (index % columns) * tileWidth;
      const y = Math.floor(index / columns) * tileHeight;
      return { input: img, top: y, left: x };
    });

    await spritesheet.composite(compositeImages).toFile(outputFile);

    console.log(`Spritesheet saved to ${outputFile}`);
  } catch (error: any) {
    console.error("Error creating spritesheet:", error?.message ?? 'unknown error');
  }
}

// Example usage
const inputDirectory = path.resolve(__dirname, "../images");
const outputFilePath = path.resolve(__dirname, "../output/spritesheet.png");
const tileWidth = 64; // Adjust as needed
const tileHeight = 64; // Adjust as needed

createSpritesheet(inputDirectory, outputFilePath, tileWidth, tileHeight);
