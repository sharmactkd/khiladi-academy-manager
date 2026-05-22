import useAuth from "../../hooks/useAuth.js";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div>
        <h2>Dashboard</h2>
        <p className="muted">Welcome, {user?.name}</p>
      </div>

      <button className="btn btn-outline" onClick={logout}>
        Logout
      </button>
    </header>
  );
};

export default Navbar;