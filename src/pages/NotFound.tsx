import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="mb-8 text-xl text-muted-foreground">Page Not Found</p>
        <Link href="/">
          <a className="text-primary hover:underline">Return Home</a>
        </Link>
      </div>
    </div>
  );
}
