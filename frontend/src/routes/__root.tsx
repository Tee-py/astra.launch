import { Toaster } from "@/components/ui/toaster";
import { Outlet, createRootRoute } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster />
      <Outlet />
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </>
  ),
});
