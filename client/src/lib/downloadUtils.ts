/**
 * Download all stems as a ZIP file
 * Uses server-side ZIP creation to avoid CORS issues
 * @param generationId ID of the music generation
 * @param trpc tRPC client instance
 */
export async function downloadAllStems(
  generationId: number,
  trpc: any
) {
  try {
    // Call server endpoint to get stem URLs and create ZIP
    const response = await fetch(`/api/stems/download-zip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to download stems");
    }

    // Get the ZIP blob from response
    const blob = await response.blob();
    
    // Trigger download
    const zipUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = zipUrl;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : "stems.zip";
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);

    return true;
  } catch (error) {
    console.error("Error downloading stems ZIP:", error);
    throw error;
  }
}
