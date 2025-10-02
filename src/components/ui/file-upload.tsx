import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "failed";
  fileId?: string;
}

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const saveFile = useMutation(api.files.saveFile);

  const handleFileChange = async (newFiles: File[]) => {
    // Add files to uploading state
    const newUploadingFiles = newFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Process each file
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      await uploadFile(file, i + uploadingFiles.length);
    }

    if (onChange) {
      onChange(newFiles);
    }
  };

  const uploadFile = async (file: File, index: number) => {
    try {
      console.log(
        "Starting upload for file:",
        file.name,
        "type:",
        file.type,
        "size:",
        file.size
      );

      // Step 1: Upload to Cloudinary
      console.log("Uploading to Cloudinary...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "vibenote"
      );
      formData.append("folder", `vibenote/${user?.id}`);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;

      const uploadResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Cloudinary upload failed:", errorText);
        throw new Error(`Cloudinary upload failed: ${uploadResponse.status}`);
      }

      const cloudinaryData = await uploadResponse.json();
      const fileUrl = cloudinaryData.secure_url;

      console.log("File uploaded to Cloudinary:", fileUrl);

      // Update progress
      setUploadingFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 40 } : f))
      );

      // Step 2: Save metadata to Convex
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      console.log("Saving file metadata to Convex...");
      const fileId = await saveFile({
        userId: user.id,
        filename: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
      });
      console.log("File metadata saved with ID:", fileId);

      // Update progress
      setUploadingFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 60, fileId } : f))
      );

      // Step 3: Send URL to Morphik AI server

      // Update to processing state
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress: 80, status: "processing" } : f
        )
      );

      const morphikServerUrl =
        process.env.NEXT_PUBLIC_MORPHIK_SERVER_URL || "http://localhost:5000";

      console.log("Sending to Morphik AI server...");
      const processResponse = await fetch(`${morphikServerUrl}/api/v1/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: fileUrl,
          user_id: user.id,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.details || "Processing failed");
      }

      // Step 4: Update status to completed in Convex
      // Note: You'll need to add an updateFileStatus mutation in Convex
      // For now, just update the local state

      // Update to completed
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress: 100, status: "completed" } : f
        )
      );

      toast.success(`${file.name} uploaded and processed successfully!`);
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "failed" } : f))
      );

      toast.error(
        `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    accept: {
      "application/pdf": [".pdf"],
    },
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log("File rejected:", error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Upload file
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Drag or drop your files here or click to upload
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {uploadingFiles.length > 0 &&
              uploadingFiles.map((uploadingFile, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-28 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm border",
                    uploadingFile.status === "completed" && "border-green-200",
                    uploadingFile.status === "failed" && "border-red-200",
                    uploadingFile.status === "processing" &&
                      "border-yellow-200",
                    uploadingFile.status === "uploading" && "border-blue-200"
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                    >
                      {uploadingFile.file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                    >
                      {(uploadingFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 "
                    >
                      {uploadingFile.file.type || "application/pdf"}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        uploadingFile.status === "uploading" &&
                          "bg-blue-100 text-blue-800",
                        uploadingFile.status === "processing" &&
                          "bg-yellow-100 text-yellow-800",
                        uploadingFile.status === "completed" &&
                          "bg-green-100 text-green-800",
                        uploadingFile.status === "failed" &&
                          "bg-red-100 text-red-800"
                      )}
                    >
                      {uploadingFile.status}
                    </motion.p>
                  </div>

                  {/* Progress bar */}
                  {uploadingFile.status !== "completed" &&
                    uploadingFile.status !== "failed" && (
                      <div className="w-full mt-2">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadingFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                </motion.div>
              ))}
            {!uploadingFiles.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-neutral-600 flex flex-col items-center"
                  >
                    Drop it
                    <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </motion.p>
                ) : (
                  <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </motion.div>
            )}

            {!uploadingFiles.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
