import { jsPDF } from "jspdf";

/**
 * Downloads strictly ONLY the certificate image as an A4 PDF
 */
export async function downloadCertificateImageAsPdf(
  imageUrl: string,
  fileName: string = "Certificate.pdf"
): Promise<void> {
  // If it's already a PDF, directly download the PDF file
  if (imageUrl.toLowerCase().endsWith(".pdf")) {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  return new Promise<void>((resolve, reject) => {
    // 1. If SVG, we fetch and create high-res data URL
    if (imageUrl.toLowerCase().endsWith(".svg") || imageUrl.includes(".svg?")) {
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
              // 300 DPI high-res canvas
              const scale = 3;
              canvas.width = (img.width || 900) * scale;
              canvas.height = (img.height || 640) * scale;
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Could not get canvas context");

              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const imgData = canvas.toDataURL("image/jpeg", 0.98);
              URL.revokeObjectURL(blobUrl);

              createPdfWithImage(imgData, canvas.width, canvas.height, fileName);
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
      return;
    }

    // 2. Normal image (JPG, PNG, WebP)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        createPdfWithImage(imgData, img.width, img.height, fileName);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = imageUrl;
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

  // ONLY embed the certificate image into the PDF!
  doc.addImage(imgData, "JPEG", posX, posY, renderWidth, renderHeight);

  const cleanName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  doc.save(cleanName);
}
