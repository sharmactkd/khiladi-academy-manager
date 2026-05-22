//D:\KHILADI-Academy-Manager\frontend\layouts\AuthLayout.jsx
const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-block">
          <h1>KHILADI</h1>
          <p>Academy Manager</p>
        </div>

        <div className="auth-content">
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;