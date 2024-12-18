// Handle form submission
const form = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');
const spritesheetImage = document.getElementById('spritesheet');
const spritesheetContainer = document.getElementById('spritesheetContainer');
const downloadBtn = document.getElementById('downloadBtn');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData();
  const files = document.getElementById('fileInput').files;
  if (files) {
    for (let file of files) {
      formData.append('images', file);
    }
  }

  try {
    const response = await fetch('/create-spritesheet', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (response.ok) {
      messageDiv.innerText = result.message || 'Spritesheet created successfully!';
      
      // Show the spritesheet
      const spritesheetUrl = '../output/spritesheet.png'; // URL to the generated file
      spritesheetImage.src = spritesheetUrl;
      spritesheetContainer.style.display = 'block'; // Show the spritesheet container

      // Enable the download button
      downloadBtn.style.display = 'inline-block';

      // Set up the download button functionality
      downloadBtn.addEventListener('click', () => {
        // Prompt user for a filename with a default value of "spritesheet"
        const filename = prompt("Enter filename:", "spritesheet.png");

        // If user provides a filename (or cancels), initiate the download
        if (filename) {
          const link = document.createElement('a');
          link.href = spritesheetUrl;  // The file to download
          link.download = filename;    // The name the user provides
          link.click();                // Trigger the download
        }
      });

    } else {
      messageDiv.innerText = result.error || 'Error occurred';
    }
  } catch (error) {
    messageDiv.innerText = 'Failed to create spritesheet.';
  }
});