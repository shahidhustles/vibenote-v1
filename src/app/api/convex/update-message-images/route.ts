import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, morphikImages, morphikContext } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 }
      );
    }

    console.log("[Update Message Images API] Updating message:", {
      messageId,
      imageCount: morphikImages?.length || 0,
    });

    // Update the message with morphik images
    await convex.mutation(api.chat.updateMessageMetadata, {
      messageId,
      metadata: {
        morphikImages,
        morphikContext,
      },
    });

    console.log("[Update Message Images API] Message updated successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Update Message Images API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
