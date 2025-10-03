export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen antialiased text-white bg-gray-900">
      {children}
    </div>
  );
}
