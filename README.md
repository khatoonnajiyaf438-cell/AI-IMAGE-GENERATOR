# AI Image Generator

An AI image generator built with plain HTML, CSS, and JavaScript.  
It uses the Pollinations AI image API to generate one or more images from a text prompt, then lets you download each result individually.

## Features

- Text prompt input for image generation
- Image size dropdown
- Number of images dropdown
- Generate button with loading spinner
- Pollinations AI API integration
- Responsive modern UI
- Download button for each generated image
- Error handling for invalid input and generation issues

## Demo

1. Enter a prompt in the text box.
2. Choose an image size.
3. Select how many images you want.
4. Click **Generate images**.
5. Download any generated image with its button.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Pollinations AI image API

## Project Structure

```text
.
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run

### Option 1: Using Python

```bash
cd AI_Image_Generator
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: Using VS Code Live Server

1. Install the Live Server extension.
2. Open `index.html`.
3. Click **Go Live**.

## Pollinations API

This project generates image URLs with Pollinations AI using the pattern below:

```text
https://image.pollinations.ai/prompt/{your-prompt}?width=1024&height=1024&nologo=true&enhance=true
```

The app supports multiple preset sizes and creates a unique seed for each image request.

## Notes

- A stable internet connection is required for image generation.
- If the browser blocks a request, try running the app from a local server instead of opening `index.html` directly.
- The generated image count and size options are controlled from the UI.

## Screenshot

Add your project screenshot here if you want to showcase the UI on GitHub.

## License

Add your preferred license here if you plan to publish the project publicly.
