
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("token/", {
        username,
        password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      // Fetch logged-in user's role.
      const meResponse = await api.get("me/");

      localStorage.setItem("role", meResponse.data.role);

      alert(`Login successful! Role: ${meResponse.data.role}`);
      navigate("/products");

    } catch (err) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("role");

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRAND PANEL */}
      <section className="login-brand-panel">
        <div className="login-brand-content">

          <div className="login-brand">
            <div className="login-brand-logo">S</div>
            <div>
              <h2>Smart Inventory</h2>
              <span>Management System</span>
            </div>
          </div>

          <div className="login-brand-message">
            <span className="login-brand-tag">
              INVENTORY MANAGEMENT
            </span>

            <h1>
              Manage your business.
              <br />
              <span>Grow with confidence.</span>
            </h1>

            <p>
              Manage products, track inventory, handle billing
              and understand your business performance — all
              from one place.
            </p>
          </div>

          <div className="login-feature-list">
            <div className="login-feature">
              <span>✓</span>
              <p>Smart inventory tracking</p>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <p>Fast and simple billing</p>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <p>Business sales analytics</p>
            </div>
          </div>

          <div className="login-brand-footer">
            © 2026 Smart Inventory Management System
          </div>
        </div>
      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className="login-form-panel">
        <div className="login-form-container">

          <div className="login-mobile-brand">
            <div className="login-brand-logo">S</div>
            <div>
              <h2>Smart Inventory</h2>
              <span>Management System</span>
            </div>
          </div>

          <div className="login-heading">
            <span className="login-welcome-tag">
              WELCOME BACK
            </span>

            <h1>Sign in to your account</h1>

            <p>
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="login-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">

            <div className="login-field">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="login-security-note">
            <span>▣</span>
            <p>Your account is protected with secure authentication.</p>
          </div>

        </div>
      </section>
    </div>
  );
}

export default Login;
