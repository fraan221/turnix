interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
}

export function YouTubeEmbed({
  videoId,
  title = "Video de YouTube para Turnix",
}: YouTubeEmbedProps) {
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ paddingTop: "56.25%" }}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full border-0"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}

export const mdxComponents = {
  YouTubeEmbed,
};
