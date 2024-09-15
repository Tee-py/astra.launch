import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmptyNodesState = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
    <div className="relative w-full max-w-md">
      <Card className="overflow-hidden shadow-lg border-t-4 border-primary">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-center text-2xl font-bold">Start Your First Node</CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-8 pb-10">
          <div className="mb-6 text-7xl font-bold text-primary/20">01</div>
          <p className="mb-6 text-lg">Begin your journey into decentralized computing.</p>
          <p className="text-sm text-muted-foreground">
            Click <span className="font-semibold text-primary">"Create Node"</span> at the top right to get started.
          </p>
          <svg
            className="absolute top-0 right-0 w-48 h-48 transform translate-x-1/3 -translate-y-1/3"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 180 Q 60 160, 50 140 T 80 100 T 110 60 T 140 20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              className="text-primary"
            />
            <path
              d="M140 20 L 160 10 L 150 30"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="text-primary"
            />
          </svg>
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-center text-muted-foreground">
        Need help?{" "}
        <a href="https://github.com/Tee-py/astra.launch" className="text-primary hover:underline">
          Read the guide
        </a>{" "}
        or{" "}
        <a href="https://github.com/Tee-py/astra.launch/issues/new" className="text-primary hover:underline">
          contact support
        </a>
        .
      </p>
    </div>
  </div>
);

export default EmptyNodesState;
