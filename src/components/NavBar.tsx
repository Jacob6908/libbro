import type { CSSProperties } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "./NavBar.css";

const LINKS = [
  { to: "/books", label: "Search", color: "#a9c5c2" }, // teal
  { to: "/profile", label: "Your Books", color: "#e7caa6" }, // ochre
  { to: "/recommendations", label: "Recommended", color: "#c4b2c6" }, // plum
];

export default function NavBar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <header className="border-b bg-white">
      <div className="nav-inner mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <Link to="/" className="nav-logo">
          li<span className="tilt">b</span>bro
        </Link>
        <nav className="flex items-center gap-2">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={{ "--chip-color": link.color } as CSSProperties}
              className={({ isActive }) =>
                `nav-chip${isActive ? " active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="nav-signout justify-self-end"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
