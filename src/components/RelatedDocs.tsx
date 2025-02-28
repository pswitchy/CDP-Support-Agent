import React from 'react';

interface RelatedDocsProps {
  docs: {
    title: string;
    url: string;
    content: string;
  }[];
}

export default function RelatedDocs({ docs }: RelatedDocsProps) {
  if (!docs || docs.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">Related Documentation</h3>
      <div className="space-y-4">
        {docs.map((doc, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {doc.title}
              </a>
            </h4>
            <p className="text-sm text-gray-600">
              {doc.content.substring(0, 200)}...
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}