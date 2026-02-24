import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { r2 } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and content type are required" },
        { status: 400 }
      );
    }

    // Generate a unique filename to avoid collisions
    // Using a simple timestamp + clean filename approach
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "-");
    const uniqueFilename = `${Date.now()}-${cleanFilename}`;

    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        ContentType: contentType,
        // ACL: "public-read", // R2 doesn't strictly support ACLs the same way, public access is bucket-level usually, but some clients send it.
      }),
      { expiresIn: 3600 } // URL valid for 1 hour
    );

    // Ensure R2_PUBLIC_URL does not have a trailing slash
    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

    return NextResponse.json({
      url: signedUrl,
      publicUrl: `${publicUrlBase}/${uniqueFilename}`,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
