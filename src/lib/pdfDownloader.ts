import { jsPDF } from "jspdf";

/**
 * Downloads strictly the certificate file as a PDF.
 * If the file is already a PDF, it fetches as a Blob to guarantee cross-origin download filename enforcement.
 * If it is an image (JPG, PNG, WebP) or SVG, it renders onto a high-DPI canvas and generates an A4 PDF.
 */
export async function downloadCertificateImageAsPdf(
  imageUrl: string,
  fileName: string = "Certificate.pdf"
): Promise<void> {
  const cleanUrl = imageUrl.split("?")[0].toLowerCase();
  const cleanFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;

  // 1. If it's already a PDF file, directly download the original PDF
  if (cleanUrl.endsWith(".pdf")) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return;
    } catch {
      // Fallback to window navigation
      const link = document.createElement("a");
      link.href = imageUrl;
      link.target = "_blank";
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }

  // 2. If it's an SVG, rasterize and generate PDF
  if (cleanUrl.endsWith(".svg") || imageUrl.includes(".svg?")) {
    return new Promise<void>((resolve, reject) => {
      fetch(imageUrl)
        .then((res) => res.text())
        .then((svgText) => {
          const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
          const blobUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const scale = 3; // 300 DPI high-res canvas
              canvas.width = (img.width || 900) * scale;
              canvas.height = (img.height || 640) * scale;
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Could not get canvas context");

              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const imgData = canvas.toDataURL("image/jpeg", 0.98);
              URL.revokeObjectURL(blobUrl);

              createPdfWithImage(imgData, canvas.width, canvas.height, cleanFileName);
              resolve();
            } catch (err) {
              URL.revokeObjectURL(blobUrl);
              reject(err);
            }
          };
          img.onerror = (e) => {
            URL.revokeObjectURL(blobUrl);
            reject(e);
          };
          img.src = blobUrl;
        })
        .catch(reject);
    });
  }

  // 3. Normal image (JPG, PNG, WebP)
  return new Promise<void>((resolve, reject) => {
    // Fetch image as blob first to avoid CORS canvas taint
    fetch(imageUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const imgData = canvas.toDataURL("image/jpeg", 0.98);
            URL.revokeObjectURL(blobUrl);

            createPdfWithImage(imgData, canvas.width, canvas.height, cleanFileName);
            resolve();
          } catch (err) {
            URL.revokeObjectURL(blobUrl);
            reject(err);
          }
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        };
        img.src = blobUrl;
      })
      .catch((err) => {
        // Fallback without blob
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const imgData = canvas.toDataURL("image/jpeg", 0.98);
            createPdfWithImage(imgData, canvas.width, canvas.height, cleanFileName);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(err);
        img.src = imageUrl;
      });
  });
}

function createPdfWithImage(
  imgData: string,
  imgWidth: number,
  imgHeight: number,
  fileName: string
) {
  // A4 Landscape: 297mm x 210mm
  const isLandscape = imgWidth >= imgHeight;
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  // Margin 6mm
  const margin = 6;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const imgAspect = imgWidth / imgHeight;
  const availableAspect = maxWidth / maxHeight;

  let renderWidth = maxWidth;
  let renderHeight = maxHeight;

  if (imgAspect > availableAspect) {
    renderHeight = maxWidth / imgAspect;
  } else {
    renderWidth = maxHeight * imgAspect;
  }

  const posX = (pageWidth - renderWidth) / 2;
  const posY = (pageHeight - renderHeight) / 2;

  // Embed the certificate image onto the PDF
  doc.addImage(imgData, "JPEG", posX, posY, renderWidth, renderHeight);

  const cleanName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  doc.save(cleanName);
}
