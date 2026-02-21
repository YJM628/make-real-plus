import JSZip from 'jszip';

/**
 * Bundle project files into a ZIP archive and trigger browser download.
 * Falls back to individual file downloads if ZIP generation fails.
 * 
 * @param files - Map of file paths to file contents
 * @param zipFileName - Name of the ZIP file to download
 * @throws Error if both ZIP bundling and fallback downloads fail
 */
export async function bundleAndDownload(
  files: Map<string, string>,
  zipFileName: string
): Promise<void> {
  try {
    // Attempt to create ZIP bundle
    const zip = new JSZip();

    // Add all files to the ZIP
    for (const [path, content] of files.entries()) {
      zip.file(path, content);
    }

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    downloadBlob(blob, zipFileName);
  } catch (error) {
    console.error('ZIP bundling failed, falling back to individual file downloads:', error);
    
    // Fallback: download each file individually
    try {
      await downloadFilesIndividually(files);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      throw new Error(
        'Failed to download project files. Please try again or check your browser settings.'
      );
    }
  }
}

/**
 * Download a blob as a file using browser download mechanism.
 * 
 * @param blob - Blob to download
 * @param fileName - Name of the file
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Fallback method: download each file individually.
 * Reuses the existing download logic from useToolEventHandlers.
 * 
 * @param files - Map of file paths to file contents
 */
async function downloadFilesIndividually(files: Map<string, string>): Promise<void> {
  for (const [path, content] of files.entries()) {
    // Determine MIME type based on file extension
    const mimeType = getMimeType(path);
    
    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const fileName = path.split('/').pop() || 'file';
    
    downloadBlob(blob, fileName);
    
    // Add small delay between downloads to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Get MIME type based on file extension.
 * 
 * @param filePath - Path to the file
 * @returns MIME type string
 */
function getMimeType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'jsx': 'text/javascript',
    'vue': 'text/plain',
    'json': 'application/json',
    'md': 'text/markdown',
    'txt': 'text/plain',
  };
  
  return mimeTypes[extension || ''] || 'text/plain';
}
