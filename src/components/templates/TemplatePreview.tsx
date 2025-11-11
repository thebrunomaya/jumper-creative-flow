interface TemplatePreviewProps {
  htmlContent: string;
}

export function TemplatePreview({ htmlContent }: TemplatePreviewProps) {
  return (
    <div className="w-full h-full bg-white rounded-md overflow-hidden border">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title="Template Preview"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
