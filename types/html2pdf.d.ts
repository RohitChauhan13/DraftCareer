declare module "html2pdf.js" {
  type Html2PdfWorker = {
    set(options: unknown): Html2PdfWorker;
    from(source: HTMLElement): Html2PdfWorker;
    save(): Promise<void>;
  };

  const html2pdf: () => Html2PdfWorker;
  export default html2pdf;
}
