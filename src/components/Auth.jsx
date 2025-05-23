import { useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";

const Auth = ({ onUserChange }) => {
  useEffect(() => {
    // Check if redirect result is available (after redirect login)
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          onUserChange(result.user);
        }
      })
      .catch((error) => {
        console.error("Login redirect error:", error);
      });

    // Listen for auth state changes (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      onUserChange(user);
    });

    return () => unsubscribe();
  }, [onUserChange]);

  const handleLogin = () => {
    signInWithRedirect(auth, provider);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div>
      {auth.currentUser ? (
        <>
          <p>Welcome, {auth.currentUser.displayName}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login with Google</button>
      )}
    </div>
  );
};

export default Auth;
