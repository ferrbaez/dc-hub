import { Suspense } from "react";
import { LoginForm } from "./login-form";

// Server wrapper — LoginForm uses useSearchParams() (for callbackUrl) which
// Next 15 refuses to prerender without a Suspense boundary above it.
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-sm text-penguin-cool-gray">
          Cargando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
