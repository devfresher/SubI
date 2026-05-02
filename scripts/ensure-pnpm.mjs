/**
 * Fail installs triggered with npm/yarn so the repo stays on pnpm only.
 */
const ua = process.env.npm_config_user_agent ?? "";
if (!ua.startsWith("pnpm/")) {
  console.error(
    "\nThis project uses pnpm only.\nInstall pnpm: https://pnpm.io/installation\nThen run: pnpm install\n",
  );
  process.exit(1);
}
