import swappupLogo from "@/assets/swappup-logo.png";

export function BrandedLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <img
          src={swappupLogo}
          alt="Swappup"
          className="h-10 w-auto animate-pulse"
        />
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default BrandedLoader;