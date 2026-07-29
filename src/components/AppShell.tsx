import { Outlet } from "react-router";
import NavBar from "./NavBar";

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Outlet />
    </div>
  );
}
