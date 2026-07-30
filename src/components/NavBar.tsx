import { Link, NavLink } from "react-router";
import { useAuth } from "../hooks/useAuth";

const LINKS = [
  { to: "/books", label: "Search" },
  { to: "/my-list", label: "My List" },
  { to: "/recommendations", label: "Recommended" },
  { to: "/profile", label: "Profile" },
];

export default function NavBar() {
  const { signOut } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          libbro
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-primary"
                  : "text-gray-600 hover:text-primary"
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => signOut()}
            className="text-gray-600 hover:text-primary"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
