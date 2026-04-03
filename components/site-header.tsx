import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { primaryNavigation } from "@/lib/navigation";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/">
          Mailbot
        </Link>
        <nav className="nav" aria-label="Primary">
          {user
            ? primaryNavigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))
            : null}
        </nav>
        <div className="site-header__auth">
          {user ? (
            <>
              <span className="muted">Signed in as {user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <Link className="button--secondary" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
