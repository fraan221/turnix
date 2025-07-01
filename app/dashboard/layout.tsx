import Header from "@/components/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main className="max-w-6xl px-4 py-8 mx-auto">
        {children}
      </main>
    </div>
  );
}