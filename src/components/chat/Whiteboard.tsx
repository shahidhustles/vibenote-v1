"use client";

import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useRef, useImperativeHandle, forwardRef, useCallback } from "react";

interface WhiteboardProps {
  chatId: string;
}

export interface WhiteboardRef {
  captureSnapshot: () => Promise<string | null>;
}

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(
  ({ chatId }, ref) => {
    const persistenceKey = `whiteboard-${chatId}`;
    const editorRef = useRef<Editor | null>(null);

    const captureSnapshot = useCallback(async (): Promise<string | null> => {
      console.log("[Whiteboard] captureSnapshot called");

      if (!editorRef.current) {
        console.error("[Whiteboard] Editor not ready");
        return null;
      }

      try {
        const editor = editorRef.current;
        const shapeIds = editor.getCurrentPageShapeIds();
        console.log(`[Whiteboard] Found ${shapeIds.size} shapes on canvas`);

        if (shapeIds.size === 0) {
          console.warn("[Whiteboard] No shapes on canvas to capture");
          return null;
        }

        console.log("[Whiteboard] Generating SVG from shapes...");
        // Get SVG representation of the canvas
        const svg = await editor.getSvgString([...shapeIds], {
          background: true,
          padding: 16,
          scale: 1,
        });

        if (!svg) {
          console.error("[Whiteboard] Failed to generate SVG");
          return null;
        }

        console.log(
          "[Whiteboard] SVG generated successfully, size:",
          svg.svg.length
        );

        // Convert SVG to canvas and then to base64 PNG
        console.log("[Whiteboard] Converting SVG to PNG...");
        return new Promise((resolve, reject) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          img.onload = () => {
            console.log(
              `[Whiteboard] Image loaded, dimensions: ${img.width}x${img.height}`
            );
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            // Convert canvas to base64
            const base64 = canvas.toDataURL("image/png");
            console.log(
              `[Whiteboard] PNG generated, base64 length: ${base64.length}`
            );
            resolve(base64);
          };

          img.onerror = (error) => {
            console.error("[Whiteboard] Failed to load SVG image:", error);
            reject(new Error("Failed to load SVG image"));
          };

          // Create blob URL from SVG string
          const svgBlob = new Blob([svg.svg], { type: "image/svg+xml" });
          const blobUrl = URL.createObjectURL(svgBlob);
          console.log("[Whiteboard] Created blob URL for SVG");
          img.src = blobUrl;
        });
      } catch (error) {
        console.error(
          "[Whiteboard] Failed to capture whiteboard snapshot:",
          error
        );
        return null;
      }
    }, []);

    useImperativeHandle(ref, () => {
      console.log(
        "[Whiteboard] useImperativeHandle - exposing captureSnapshot"
      );
      return {
        captureSnapshot,
      };
    }, [captureSnapshot]);

    return (
      <div className="w-full h-full">
        <Tldraw
          persistenceKey={persistenceKey}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    );
  }
);

Whiteboard.displayName = "Whiteboard";
