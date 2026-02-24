export async function uploadToR2(file: File): Promise<string> {
  // 1. Get the signed URL from the backend
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error obtaining upload permission");
  }

  const { url, publicUrl } = await response.json();

  // 2. Upload the file directly to R2 using the signed URL
  const uploadResponse = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Error uploading file to storage");
  }

  return publicUrl;
}
