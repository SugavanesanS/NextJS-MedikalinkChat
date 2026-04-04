export { };
declare global {
  interface Window {
    pdfjsLib: {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      getDocument: (
        source: string | { url: string }
      ) => {
        promise: Promise<PDFDocumentProxy>;
      };
      version: string;
    };
  }

  interface PDFDocumentProxy {
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    numPages: number;
  }

  interface PDFPageProxy {
    render(params: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }): { promise: Promise<void> };
    getViewport(params: { scale: number; rotation?: number }): PDFPageViewport;
  }

  interface PDFPageViewport {
    width: number;
    height: number;
    transform: number[];
  }
}
