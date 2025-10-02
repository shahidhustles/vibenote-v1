"use client";

import { FileUpload } from "@/components/ui/file-upload";
import { UploadedFilesList } from "@/components/upload/uploaded-files-list";

const UploadPage = () => {
  return (
    <div className="relative bg-white h-full">
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left Column - Upload Component with Full Background */}
        <div className="relative w-full lg:w-1/2 min-h-[400px] lg:min-h-0 overflow-hidden">
          {/* File Upload Background extending full area */}
          <div className="absolute inset-0 bg-gray-100 dark:bg-neutral-900">
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
              <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105 h-full">
                {Array.from({ length: 20 }).map((_, row) =>
                  Array.from({ length: 20 }).map((_, col) => {
                    const index = row * 20 + col;
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
            </div>
          </div>

          {/* Content overlay */}
          <div className="relative z-10 h-full flex flex-col justify-center p-6 lg:p-8">
            <div className="max-w-lg mx-auto w-full">
              <FileUpload />
            </div>
          </div>
        </div>

        {/* Vertical Divider - Hidden on mobile */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

        {/* Horizontal Divider - Visible on mobile */}
        <div className="lg:hidden h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-6"></div>

        {/* Right Column - Uploaded Files List */}
        <div className="w-full lg:w-1/2 p-6 lg:p-8 bg-white/50 flex-1 min-h-0">
          <UploadedFilesList />
        </div>
      </div>
    </div>
  );
};
export default UploadPage;
