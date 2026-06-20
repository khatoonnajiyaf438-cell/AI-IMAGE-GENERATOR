const form = document.getElementById("generatorForm");
const promptInput = document.getElementById("promptInput");
const sizeSelect = document.getElementById("sizeSelect");
const countSelect = document.getElementById("countSelect");
const generateButton = document.getElementById("generateButton");
const gallery = document.getElementById("gallery");
const statusText = document.getElementById("statusText");
const errorBanner = document.getElementById("errorBanner");
const cardTemplate = document.getElementById("imageCardTemplate");

// Map the friendly dropdown values to the actual Pollinations dimensions.
const sizeMap = {
  "1024x1024": { width: 1024, height: 1024, label: "Square" },
  "1536x1024": { width: 1536, height: 1024, label: "Landscape" },
  "1024x1536": { width: 1024, height: 1536, label: "Portrait" },
  "1280x720": { width: 1280, height: 720, label: "Wide" },
};

let activeGenerationId = 0;
const createdObjectUrls = new Set();

window.addEventListener("beforeunload", revokeObjectUrls);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  const sizeKey = sizeSelect.value;
  const imageCount = Number(countSelect.value);

  if (!prompt) {
    showError("Please enter an image prompt before generating.");
    promptInput.focus();
    return;
  }

  const size = sizeMap[sizeKey];
  if (!size) {
    showError("Please choose a valid image size.");
    return;
  }

  hideError();
  setLoadingState(true);
  // Revoke old blob URLs before generating a fresh batch.
  revokeObjectUrls();
  gallery.innerHTML = "";

  // Track the current run so stale responses never overwrite newer ones.
  const generationId = ++activeGenerationId;
  statusText.textContent = `Generating ${imageCount} image${imageCount > 1 ? "s" : ""}...`;

  try {
    const cards = Array.from({ length: imageCount }, (_, index) =>
      createImageCard(index, prompt, size, generationId)
    );

    gallery.replaceChildren(...cards.map((card) => card.element));

    await Promise.all(cards.map((card) => card.loadPromise));

    if (generationId !== activeGenerationId) {
      return;
    }

    statusText.textContent = `Finished generating ${imageCount} image${imageCount > 1 ? "s" : ""}.`;
  } catch (error) {
    if (generationId !== activeGenerationId) {
      return;
    }

    console.error("Image generation failed:", error);
    showError(getReadableError(error));
    statusText.textContent = "Generation failed. Please try again.";
  } finally {
    if (generationId === activeGenerationId) {
      setLoadingState(false);
    }
  }
});

function createImageCard(index, prompt, size, generationId) {
  const fragment = cardTemplate.content.cloneNode(true);
  const element = fragment.querySelector(".image-card");
  const image = fragment.querySelector(".generated-image");
  const imageLabel = fragment.querySelector(".image-label");
  const downloadButton = fragment.querySelector(".download-button");

  const variantPrompt = `${prompt}${index > 0 ? `, variation ${index + 1}` : ""}`;
  const imageUrl = buildImageUrl(variantPrompt, size, index);

  imageLabel.textContent = `${size.label} · Image ${index + 1}`;
  image.alt = `${prompt} - generated image ${index + 1}`;
  downloadButton.textContent = "Preparing...";
  downloadButton.setAttribute("aria-disabled", "true");

  const loadPromise = new Promise((resolve, reject) => {
    prepareImageAndDownload(image, downloadButton, imageUrl, prompt, index, size)
      .then(() => {
        if (generationId !== activeGenerationId) {
          resolve();
          return;
        }

        element.classList.add("is-loaded");
        image.classList.add("is-visible");
        resolve();
      })
      .catch(reject);
  });

  return { element, loadPromise };
}

async function prepareImageAndDownload(image, downloadButton, imageUrl, prompt, index, size) {
  try {
    const response = await fetch(imageUrl, { mode: "cors" });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    createdObjectUrls.add(objectUrl);

    downloadButton.href = objectUrl;
    downloadButton.download = buildFileName(prompt, index, size, blob.type);
    downloadButton.textContent = "Download";
    downloadButton.removeAttribute("aria-disabled");

    return await loadPreviewImage(image, objectUrl, prompt, index);
  } catch (error) {
    console.warn("Falling back to direct image URL for download.", error);
    downloadButton.href = imageUrl;
    downloadButton.download = buildFileName(prompt, index, size, "image/jpeg");
    downloadButton.textContent = "Download";
    downloadButton.removeAttribute("aria-disabled");

    return await loadPreviewImage(image, imageUrl, prompt, index);
  }
}

function loadPreviewImage(image, sourceUrl, prompt, index) {
  return new Promise((resolve, reject) => {
    image.onload = () => {
      image.onload = null;
      image.onerror = null;
      image.alt = `${prompt} - generated image ${index + 1}`;
      resolve();
    };

    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Unable to render image ${index + 1}.`));
    };

    image.src = sourceUrl;
  });
}

function buildImageUrl(prompt, size, index) {
  const params = new URLSearchParams({
    width: String(size.width),
    height: String(size.height),
    nologo: "true",
    enhance: "true",
    seed: String(Date.now() + index),
  });

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

function buildFileName(prompt, index, size, mimeType) {
  const safePrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36) || "pollinations-image";

  const extension = mimeType && mimeType.includes("png") ? "png" : "jpg";

  return `${safePrompt}-${size.width}x${size.height}-${index + 1}.${extension}`;
}

function setLoadingState(isLoading) {
  generateButton.disabled = isLoading;
  generateButton.classList.toggle("is-loading", isLoading);
  promptInput.disabled = isLoading;
  sizeSelect.disabled = isLoading;
  countSelect.disabled = isLoading;
  form.setAttribute("aria-busy", String(isLoading));
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

function revokeObjectUrls() {
  for (const objectUrl of createdObjectUrls) {
    URL.revokeObjectURL(objectUrl);
  }

  createdObjectUrls.clear();
}

function hideError() {
  errorBanner.textContent = "";
  errorBanner.hidden = true;
}

function getReadableError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while generating the images.";
}
