import { Routes, Route } from "react-router";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import BookSearch from "./pages/BookSearch";
import BookDetail from "./pages/BookDetail";
import Profile from "./pages/Profile";
import Recommendations from "./pages/Recommendations";
import RecommendationsAll from "./pages/RecommendationsAll";
import MyList from "./pages/MyList";
import RequireAuth from "./components/RequireAuth";
import AppShell from "./components/AppShell";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
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
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/recommendations/all" element={<RecommendationsAll />} />
        <Route path="/my-list" element={<MyList />} />
      </Route>
    </Routes>
  );
}

export default App;
