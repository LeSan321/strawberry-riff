/**
 * Download all stems as a ZIP file
 * Uses server-side ZIP creation to avoid CORS issues
 * @param generationId ID of the music generation
 * @param title Title of the generation (for logging only)
 */
export async function downloadAllStems(
  generationId: number,
  title?: string
) {
  try {
    console.log(`[Download] Starting ZIP download for generation ${generationId}`);
    
    // Call server endpoint to get stem URLs and create ZIP
    const response = await fetch(`/api/stems/download-zip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ generationId }),
    });

    console.log(`[Download] Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = "Failed to download stems";
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      console.error(`[Download] Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Get the ZIP blob from response
    const blob = await response.blob();
    console.log(`[Download] ZIP blob size: ${blob.size} bytes`);
    
    // Trigger download
    const zipUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = zipUrl;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : "stems.zip";
    
    console.log(`[Download] Filename: ${filename}`);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);

    console.log(`[Download] ZIP download completed successfully`);
    return true;
  } catch (error) {
    console.error("[Download] Error downloading stems ZIP:", error);
    throw error;
  }
}
