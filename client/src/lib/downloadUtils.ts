import JSZip from "jszip";

/**
 * Download all stems as a ZIP file
 * @param stems Object containing stem URLs keyed by stem type
 * @param trackTitle Title of the track for the ZIP filename
 */
export async function downloadAllStems(
  stems: {
    vocals?: string | null;
    drums?: string | null;
    bass?: string | null;
    other?: string | null;
    piano?: string | null;
  },
  trackTitle: string
) {
  try {
    const zip = new JSZip();
    const stemFolder = zip.folder("stems");

    if (!stemFolder) throw new Error("Failed to create ZIP folder");

    // Sanitize track title for filename
    const sanitizedTitle = trackTitle
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_")
      .toLowerCase();

    // Map of stem types to their display names
    const stemMappings: Array<[string, keyof typeof stems]> = [
      ["vocals", "vocals"],
      ["drums", "drums"],
      ["bass", "bass"],
      ["other", "other"],
      ["piano", "piano"],
    ];

    // Download each stem and add to ZIP
    for (const [displayName, stemKey] of stemMappings) {
      const url = stems[stemKey];
      if (!url) continue;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to fetch ${stemKey} stem: ${response.statusText}`);
          continue;
        }

        const blob = await response.blob();
        const filename = `${sanitizedTitle}_${displayName}.mp3`;
        stemFolder.file(filename, blob);
      } catch (error) {
        console.warn(`Error downloading ${stemKey} stem:`, error);
        // Continue with other stems even if one fails
      }
    }

    // Generate ZIP and trigger download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = `${sanitizedTitle}_stems.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);

    return true;
  } catch (error) {
    console.error("Error creating ZIP file:", error);
    throw error;
  }
}
