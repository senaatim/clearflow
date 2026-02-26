import { BackgroundEffects } from '@/components/layout/background-effects';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <BackgroundEffects />
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  );
}
