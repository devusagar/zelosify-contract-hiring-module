"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OpeningDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [opening, setOpening] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch opening details
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendor/openings/${id}`)
      .then(res => res.json())
      .then(data => setOpening(data.data))
      .catch(err => console.error("Error fetching opening:", err));
  }, [id]);

  // Handle Drag & Drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Filter for PDF and PPTX only as required by the assignment
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.pdf') || file.name.endsWith('.pptx')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  // Soft delete from upload queue
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Execute S3 Presign & Upload Flow
  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setMessage("");

    try {
      for (const file of files) {
        // 1. Get Presigned URL from your backend
        const presignRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendor/openings/${id}/profiles/presign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        const { signedUrl, fileKey } = await presignRes.json();

        // 2. Upload file directly to AWS S3 bucket
        await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file
        });

        // 3. Submit profile to backend (which automatically triggers the AI Agent)
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendor/openings/${id}/profiles/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key: fileKey })
        });
      }
      setMessage("✅ Files successfully uploaded and sent to AI Agent for scoring!");
      setFiles([]); // Clear the queue
    } catch (error) {
      setMessage("❌ Error uploading files.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!opening) return <div className="p-8 dark:text-white">Loading details...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto dark:text-white transition-colors min-h-screen">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h1 className="text-3xl font-bold mb-2">{opening.title}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {opening.location || "Location N/A"} • {opening.contractType || "Contract N/A"}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Profiles Submitted: {opening.profilesCount || 0}
        </p>
      </div>

      {/* Drag & Drop Upload Section */}
      <div 
        className="border-2 border-dashed border-gray-400 p-12 text-center rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer mb-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <p className="text-lg font-medium">Drag and drop candidate resumes here</p>
        <p className="text-sm text-gray-500 mt-2">Only .pdf and .pptx files are supported</p>
      </div>

      {/* File Queue & Soft Delete */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Files ready to upload:</h3>
          <ul className="space-y-2 mb-4">
            {files.map((f, idx) => (
              <li key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded shadow">
                <span className="font-medium">{f.name}</span>
                <button 
                  onClick={() => removeFile(idx)} 
                  className="text-red-500 font-bold hover:text-red-700 transition"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 transition w-full"
          >
            {isUploading ? "Uploading & Analyzing via AI..." : "Submit Candidate Profiles"}
          </button>
        </div>
      )}

      {message && <p className="mt-4 font-semibold text-lg">{message}</p>}
    </div>
  );
}