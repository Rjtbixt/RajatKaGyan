import React, { useEffect } from "react";
import "./styles.css";
import { useNavigate } from "react-router-dom"; // ❌ removed unused Link
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import userSvg from "../../assets/user.svg";

function Header() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  function logout() {
    auth.signOut();
    navigate("/");
  }

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
    // ❌ Removed navigate("/dashboard") to prevent redirect loop
  }, [user, navigate]);

  return (
    <div className="navbar">
      <p className="navbar-heading">FinTrack.</p>
      {user ? (
        <p className="navbar-link" onClick={logout}>
          <span style={{ marginRight: "1rem" }}>
            <img
              src={user.photoURL ? user.photoURL : userSvg}
              width={user.photoURL ? "32" : "24"}
              style={{ borderRadius: "50%" }}
              alt="User Avatar"   // ✅ added alt
            />
          </span>
          Logout
        </p>
      ) : null}
    </div>
  );
}

export default Header;
