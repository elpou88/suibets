import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source and destination directories
const sourceDir = path.join(__dirname, '..', 'attached_assets');
const destDir = path.join(__dirname, '..', 'client', 'public', 'assets');

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Async function using promises
async function copyAssets() {
  try {
    // Read directory
    const files = await fs.promises.readdir(sourceDir);
    
    // Filter image files
    const imageFiles = files.filter(file => 
      file.endsWith('.png') || 
      file.endsWith('.jpg') || 
      file.endsWith('.jpeg') || 
      file.endsWith('.gif')
    );
    
    console.log(`Found ${imageFiles.length} image files to copy.`);
    
    // Copy each file
    for (const file of imageFiles) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      try {
        await fs.promises.copyFile(sourcePath, destPath);
        console.log(`Successfully copied ${file}`);
      } catch (err) {
        console.error(`Error copying ${file}: ${err}`);
      }
    }
    
    console.log('Asset copying completed.');
  } catch (err) {
    console.error(`Error reading source directory: ${err}`);
    process.exit(1);
  }
}

// Run the async function
copyAssets();