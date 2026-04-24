import { Suspense } from "react";
import { HomeView } from "./home-view";

// Server wrapper: needed because HomeView is a client component that calls
// useSearchParams(), which Next 15 refuses to prerender without a Suspense
// boundary above it.
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-sm text-penguin-cool-gray">
          Cargando...
        </div>
      }
    >
      <HomeView />
    </Suspense>
  );
}
