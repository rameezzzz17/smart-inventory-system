
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardResponse, stockResponse] =
          await Promise.all([
            api.get("dashboard/"),
            api.get("low-stock/"),
          ]);

        setDashboard(dashboardResponse.data);
        setLowStock(stockResponse.data.products || []);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Dashboard data load nahi ho paaya."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-state">
        <div className="dashboard-loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-state dashboard-error">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-state">
        <p>Dashboard data unavailable.</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Products",
      value: dashboard.total_products ?? 0,
      icon: "▦",
      color: "blue",
      description: "Products in inventory",
    },
    {
      title: "Total Customers",
      value: dashboard.total_customers ?? 0,
      icon: "♙",
      color: "cyan",
      description: "Registered customers",
    },
    {
      title: "Total Invoices",
      value: dashboard.total_invoices ?? 0,
      icon: "▤",
      color: "purple",
      description: "Invoices generated",
    },
    {
      title: "Paid Revenue",
      value: formatCurrency(dashboard.paid_revenue),
      icon: "₹",
      color: "green",
      description: "Successfully paid amount",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(dashboard.pending_amount),
      icon: "◷",
      color: "orange",
      description: "Payment awaiting",
    },
    {
      title: "Cancelled Invoices",
      value: dashboard.cancelled_invoices ?? 0,
      icon: "×",
      color: "red",
      description: "Cancelled transactions",
    },
  ];

  return (
    <div className="dashboard-page">

      {/* Dashboard Heading */}
      <section className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            OVERVIEW
          </span>

          <h1>Dashboard</h1>

          <p>
            Welcome to your Smart Inventory Management System.
            Here's what's happening with your business.
          </p>
        </div>

        <div className="dashboard-date">
          <span className="date-icon">▦</span>
          <span>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="dashboard-summary">
        <div className="section-heading">
          <div>
            <h2>Business Overview</h2>
            <p>Your important business statistics</p>
          </div>
        </div>

        <div className="dashboard-cards">
          {cards.map((card) => (
            <article
              className="dashboard-card"
              key={card.title}
            >
              <div className="card-top">
                <div className={`card-icon ${card.color}`}>
                  {card.icon}
                </div>

                <span className="card-indicator">
                  Overview
                </span>
              </div>

              <div className="card-info">
                <p>{card.title}</p>
                <h3>{card.value}</h3>
                <span>{card.description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Low Stock Section */}
      <section className="low-stock-section">
        <div className="section-heading">
          <div>
            <h2>Low Stock Alerts</h2>
            <p>
              Monitor products that need restocking.
            </p>
          </div>

          <span className="stock-count">
            {lowStock.length} Products
          </span>
        </div>

        <div className="stock-table-card">
          {lowStock.length === 0 ? (
            <div className="empty-stock">
              <div className="empty-stock-icon">✓</div>
              <h3>Inventory looks healthy!</h3>
              <p>
                All products have sufficient stock.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Available Quantity</th>
                    <th>Stock Status</th>
                  </tr>
                </thead>

                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className="product-id">
                          #{product.id}
                        </span>
                      </td>

                      <td className="product-name">
                        {product.name}
                      </td>

                      <td>
                        <strong>
                          {product.quantity}
                        </strong>
                      </td>

                      <td>
                        <span className="stock-alert">
                          {product.alert || "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="dashboard-footer">
        Smart Inventory Management System
        <span>•</span>
        Business Overview
      </footer>

    </div>
  );
}

export default Dashboard;
