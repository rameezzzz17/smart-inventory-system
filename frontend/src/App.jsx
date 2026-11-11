
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Billing from "./pages/Billing";
import SalesReports from "./pages/SalesReports";
import Login from "./pages/Login";
import AdminUPIVerification from "./pages/AdminUPIVerification";

// Check login authentication
function ProtectedRoute() {
  const token = localStorage.getItem("access");

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

// Admin-only route protection
function AdminRoute() {
  const role = localStorage.getItem("role");

  return role === "Admin"
    ? <Outlet />
    : <Navigate to="/" replace />;
}

// Sidebar navigation items
const navigationItems = [
  { path: "/", label: "Dashboard", end: true, icon: "▦" },
  { path: "/products", label: "Products", icon: "□" },
  { path: "/categories", label: "Categories", icon: "▤" },
  { path: "/customers", label: "Customers", icon: "♙" },
  { path: "/billing", label: "Billing", icon: "▧" },

  {
    path: "/sales-reports",
    label: "Sales Reports",
    icon: "▥",
    adminOnly: true,
  },
  {
    path: "/admin/upi-verification",
    label: "Admin UPI Verification",
    icon: "✓",
    adminOnly: true,
  },
];

// Main application layout
function AppLayout() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.adminOnly || role === "Admin"
  );

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");

    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>Smart Inventory</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">S</div>
          <div>
            <strong>Smart Inventory</strong>
            <span>{role || "User"} Account</span>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <span className="status-dot"></span>
            <span>Workspace</span>
            <span className="role-label">{role}</span>
          </div>

          <div className="topbar-actions">
            <span className="logged-in-label">Logged In</span>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Main application
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* Admin and Staff pages */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/billing" element={<Billing />} />

            {/* Admin-only pages */}
            <Route element={<AdminRoute />}>
              <Route
                path="/sales-reports"
                element={<SalesReports />}
              />

              <Route
                path="/admin/upi-verification"
                element={<AdminUPIVerification />}
              />
            </Route>

          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
