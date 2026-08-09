import { Routes, Route } from "react-router";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import BookSearch from "./pages/BookSearch";
import BookDetail from "./pages/BookDetail";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Recommendations from "./pages/Recommendations";
import RecommendationsAll from "./pages/RecommendationsAll";
import RequireAuth from "./components/RequireAuth";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";
import AppShell from "./components/AppShell";

function App() {
  return (
    <Routes>
      <Route
        path="/signin"
        element={
          <RedirectIfAuthenticated>
            <SignIn />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthenticated>
            <SignUp />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookSearch />} />
        <Route path="/books/:bookId" element={<BookDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/recommendations/all" element={<RecommendationsAll />} />
      </Route>
    </Routes>
  );
}

export default App;
