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
import MyList from "./pages/MyList";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/books"
        element={
          <RequireAuth>
            <BookSearch />
          </RequireAuth>
        }
      />
      <Route
        path="/books/:bookId"
        element={
          <RequireAuth>
            <BookDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/recommendations"
        element={
          <RequireAuth>
            <Recommendations />
          </RequireAuth>
        }
      />
      <Route
        path="/my-list"
        element={
          <RequireAuth>
            <MyList />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
