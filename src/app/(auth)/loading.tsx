import { AuthFormSkeleton } from "@/components/auth/auth-skeleton";

export default function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <AuthFormSkeleton />
    </div>
  );
}
