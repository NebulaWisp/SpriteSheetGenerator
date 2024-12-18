import express from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer'

const app = express();
const port = 3000;

// Set up multer to handle file uploads with original filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Set the destination folder where the images will be saved
        cb(null, path.join(__dirname, '../images'));
    },
    filename: (req, file, cb) => {
        // Use the original file name and extension
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Serve static files from 'public' folder (for front-end assets like HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the output directory
app.use('/output', express.static(path.join(__dirname, '../output'), {
    setHeaders: (res, path) => {
        res.set('Cache-Control', 'no-store'); // Prevent caching
    }
}));
// Serve static files from the output directory
app.use('/images', express.static(path.join(__dirname, '../images')));

// Ensure the output directory exists before attempting to save the spritesheet
const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Ensure the output directory exists before attempting to save the spritesheet
const imageDir = path.join(__dirname, '../images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}

// Function to create the spritesheet
async function createSpritesheet(inputDir: string, outputFile: string): Promise<void> {
    try {
        // Read files in the input directory
        const files = fs
            .readdirSync(inputDir)
            .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
            .sort((a, b) => parseInt(a) - parseInt(b)); // Sort by numerical order

        if (files.length === 0) {
            throw new Error("No image files found in the directory.");
        }

        // Load and process images without resizing
        const images = await Promise.all(
            files.map(file => sharp(path.join(inputDir, file)).toBuffer())
        );

        // Get metadata for the images (width and height)
        const metadataList = await Promise.all(
            files.map(file => sharp(path.join(inputDir, file)).metadata())
        );

        const tileWidths = metadataList.map(meta => meta.width || 0);
        const tileHeights = metadataList.map(meta => meta.height || 0);

        // Spritesheet width and height calculation
        const spritesheetWidth = tileWidths.reduce((sum, w) => sum + w, 0); // Total width of all images
        const spritesheetHeight = Math.max(...tileHeights); // Maximum height of the images

        // Create an empty sharp image for the spritesheet
        const spritesheet = sharp({
            create: {
                width: spritesheetWidth,
                height: spritesheetHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        });

        // Composite images onto the spritesheet
        const compositeImages = images.map((img, index) => {
            const x = tileWidths.slice(0, index).reduce((sum, w) => sum + w, 0); // Calculate x position for each image
            const y = 0; // Place all images in a single row (adjust as needed)
            return { input: img, top: y, left: x };
        });

        // Save the final spritesheet
        await spritesheet.composite(compositeImages).toFile(outputFile);

        console.log(`Spritesheet saved to ${outputFile}`);
    } catch (error: any) {
        console.error("Error creating spritesheet:", error?.message ?? 'unknown error');
    }
}

// Route to handle spritesheet creation
app.post('/create-spritesheet', upload.array('images'), async (req, res): Promise<any> => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
    }

    const inputDirectory = path.resolve(__dirname, "../images");
    const outputFilePath = path.resolve(__dirname, "../output/spritesheet.png");
    console.log(inputDirectory);
    console.log(outputFilePath);

    try {
        // Generate the spritesheet
        await createSpritesheet(inputDirectory, outputFilePath);

        // Clean up the uploaded files (images)
        files.forEach((file) => {
            const filePath = path.join(inputDirectory, file.filename);
            fs.unlinkSync(filePath); // Delete each uploaded image after the spritesheet is created
        });

        res.status(200).send({ message: "Spritesheet created successfully!" });

    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
