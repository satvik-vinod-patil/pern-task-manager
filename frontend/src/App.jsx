import { useState } from "react";
import { clearToken, getToken } from "./api.js";
import AuthForm from "./AuthForm.jsx";
import Tasks from "./Tasks.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));

  function logout() {
    clearToken();
    setLoggedIn(false);
  }

  return (
    <main>
      <header>
        <h1>Task Manager</h1>
        {loggedIn && (
          <button className="link" onClick={logout}>
            Log out
          </button>
        )}
      </header>

      {loggedIn ? (
        <Tasks onUnauthorized={logout} />
      ) : (
        <AuthForm onAuthenticated={() => setLoggedIn(true)} />
      )}
    </main>
  );
}
