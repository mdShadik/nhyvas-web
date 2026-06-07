/**
 * Image processing utility for compression and watermarking.
 */

export async function processImageWithWatermark(
  file: File,
  watermarkSrc: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    watermarkSize?: number; // percentage of image width
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    watermarkSize = 0.08, // 8% of width
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate target dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        // Load and draw watermark
        const wm = new Image();
        wm.crossOrigin = "anonymous";
        wm.onload = () => {
          const wmWidth = width * watermarkSize;
          const wmHeight = (wm.height / wm.width) * wmWidth;
          const padding = width * 0.02; // 2% padding

          // Top Left
          ctx.globalAlpha = 0.6;
          ctx.drawImage(wm, padding, padding, wmWidth, wmHeight);

          // Bottom Right
          ctx.drawImage(
            wm,
            width - wmWidth - padding,
            height - wmHeight - padding,
            wmWidth,
            wmHeight
          );
          ctx.globalAlpha = 1.0;

          // Export as blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: "image/jpeg" }));
              } else {
                reject(new Error("Canvas toBlob failed"));
              }
            },
            "image/jpeg",
            quality
          );
        };
        wm.onerror = () => reject(new Error("Failed to load watermark"));
        wm.src = watermarkSrc;
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}
