/**
 * Fallback PDF generation when @react-pdf/renderer is not available
 */

/**
 * Stub function to render to buffer
 * @returns null to indicate PDF generation is unavailable
 */
export async function renderToBuffer(element: any): Promise<null> {
  console.warn(
    '[PDF] @react-pdf/renderer is not installed. PDF generation is unavailable.',
    'Install with: npm install @react-pdf/renderer'
  );
  return null;
}

export const PDF_UNAVAILABLE = 'PDF generation is unavailable. Install @react-pdf/renderer to enable this feature.';
