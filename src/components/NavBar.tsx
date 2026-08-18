import type { CSSProperties } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "./NavBar.css";

const LINKS = [
  { to: "/", label: "Home", color: "#deb1a7", tilt: "-1.5deg", end: true }, // rust
  { to: "/books", label: "Search", color: "#a9c5c2", tilt: "1.5deg" }, // teal
  { to: "/profile", label: "Your Library", color: "#e7caa6", tilt: "-1.5deg" }, // ochre
  {
    to: "/recommendations",
    label: "Recommended",
    color: "#c4b2c6",
    tilt: "1.5deg",
    beta: true,
  }, // plum
];

export default function NavBar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <header>
      <div className="nav-inner mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <Link to="/" className="nav-logo">
          li<span className="tilt">b</span>bro
        </Link>
        <nav className="flex items-center gap-7">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={
                {
                  "--mark": link.color,
                  "--tilt": link.tilt,
                } as CSSProperties
              }
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {link.label}
              {link.beta && <span className="beta-ribbon">Beta</span>}
              <span className="mark" />
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="nav-signout justify-self-end"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H9" />
            <path d="M7 4v4.5l1-1 1 1V4" />
            <path d="M11 12h9" />
            <path d="M17 8.5l3 3.5-3 3.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
