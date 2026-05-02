import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return <LoginForm authError={searchParams.error} redirectTo={searchParams.next} />;
}
