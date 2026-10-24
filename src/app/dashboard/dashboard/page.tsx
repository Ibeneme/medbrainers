export default function DashboardHomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-black text-white px-6">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Dashboard</h1>
      <p className="mt-3 max-w-md text-center text-sm text-white/60">
        Welcome to MedBrainers. Your clinical workspace is ready.
      </p>
    </div>
  );
}
