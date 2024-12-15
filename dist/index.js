"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpritesheet = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
// Just testing it here
function createSpritesheet(inputDir, outputFile) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Read files in the input directory
            const files = fs_1.default
                .readdirSync(inputDir)
                .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
                .sort((a, b) => parseInt(a) - parseInt(b)); // Sort by numerical order
            if (files.length === 0) {
                throw new Error("No image files found in the directory.");
            }
            // Load and process images
            const images = yield Promise.all(files.map(file => (0, sharp_1.default)(path_1.default.join(inputDir, file)).toBuffer()));
            // Determine spritesheet dimensions
            const columns = Math.ceil(Math.sqrt(files.length)); // Square grid layout
            const rows = Math.ceil(files.length / columns);
            const metadataList = yield Promise.all(files.map(file => (0, sharp_1.default)(path_1.default.join(inputDir, file)).metadata()));
            const tileWidths = metadataList.map(meta => meta.width || 0);
            const tileHeights = metadataList.map(meta => meta.height || 0);
            // Spritesheet dimensions
            const spritesheetWidth = tileWidths.reduce((sum, w, i) => sum + w, 0); // sum of widths of all tiles in a row
            const spritesheetHeight = Math.max(...tileHeights); // maximum height of all tiles
            const spritesheet = (0, sharp_1.default)({
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
            yield spritesheet.composite(compositeImages).toFile(outputFile);
            console.log(`Spritesheet saved to ${outputFile}`);
        }
        catch (error) {
            console.error("Error creating spritesheet:", (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : 'unknown error');
        }
    });
}
exports.createSpritesheet = createSpritesheet;
// Example usage
const inputDirectory = path_1.default.resolve(__dirname, "../images");
const outputFilePath = path_1.default.resolve(__dirname, "../dist/output/spritesheet.png");
const tileWidth = 64; // Adjust as needed
const tileHeight = 64; // Adjust as needed
// createSpritesheet(inputDirectory, outputFilePath, tileWidth, tileHeight);
