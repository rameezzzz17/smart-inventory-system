
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./SalesReports.css";

function BarChart({ title, data, labelKey, valueKey, formatter, type }) {
  const maxValue = Math.max(
    ...data.map((item) => Number(item[valueKey] || 0)),
    1
  );

  return (
    <section className="reports-chart-card">
      <div className="reports-chart-heading">
        <div>
          <h3>{title}</h3>
          <p>Performance overview</p>
        </div>
        <span className="reports-chart-icon">▥</span>
      </div>

      {data.length === 0 ? (
        <div className="reports-chart-empty">
          No data available.
        </div>
      ) : (
        <div className="reports-bars">
          {data.map((item, index) => {
            const value = Number(item[valueKey] || 0);
            const percentage = (value / maxValue) * 100;

            return (
              <div className="reports-bar-item" key={index}>
                <div className="reports-bar-label">
                  <span>{item[labelKey]}</span>
                  <strong>{formatter(value)}</strong>
                </div>

                <div className="reports-bar-background">
                  <div
                    className={`reports-bar-fill ${type || ""}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SalesReports() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [summaryResponse, dailyResponse, monthlyResponse] =
        await Promise.all([
          api.get("sales-report/"),
          api.get("daily-sales-report/"),
          api.get("monthly-sales-report/"),
        ]);

      setSummary(summaryResponse.data);
      setDailySales(dailyResponse.data);
      setMonthlySales(monthlyResponse.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Unable to load sales reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [navigate]);

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });

  const formatDate = (date) =>
    date
      ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN")
      : "-";

  const formatMonth = (month) =>
    month
      ? new Date(month).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : "-";

  const dailyChartData = dailySales.map((sale) => ({
    ...sale,
    chartLabel: formatDate(sale.date),
  }));

  const monthlyChartData = monthlySales.map((sale) => ({
    ...sale,
    chartLabel: formatMonth(sale.month),
  }));

  const orderChartData = [
    {
      name: "Paid Orders",
      count: Number(summary.total_paid_orders || 0),
    },
    {
      name: "Cancelled Orders",
      count: Number(summary.cancelled_orders || 0),
    },
  ];

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(summary.total_revenue),
      icon: "₹",
      color: "purple",
      description: "Revenue from paid orders",
    },
    {
      title: "Paid Orders",
      value: summary.total_paid_orders || 0,
      icon: "✓",
      color: "green",
      description: "Successfully paid orders",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.pending_amount),
      icon: "◷",
      color: "orange",
      description: "Amount awaiting payment",
    },
    {
      title: "Cancelled Orders",
      value: summary.cancelled_orders || 0,
      icon: "×",
      color: "red",
      description: "Cancelled invoices",
    },
  ];

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-loader"></div>
        <h3>Loading Sales Reports...</h3>
        <p>Please wait while we prepare your analytics.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <h1>Sales Reports</h1>
        <div className="reports-error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={fetchReports}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">

      {/* HEADER */}
      <section className="reports-page-header">
        <div>
          <span className="reports-eyebrow">BUSINESS INSIGHTS</span>
          <h1>Sales Reports & Analytics</h1>
          <p>
            Monitor your revenue, orders and overall sales performance.
          </p>
        </div>

        <button
          className="reports-refresh-button"
          onClick={fetchReports}
          disabled={loading}
        >
          ↻ Refresh Reports
        </button>
      </section>

      {/* SUMMARY CARDS */}
      <section className="reports-summary-grid">
        {cards.map((card) => (
          <article className="reports-summary-card" key={card.title}>
            <div className="reports-summary-top">
              <span>{card.title}</span>
              <div className={`reports-summary-icon ${card.color}`}>
                {card.icon}
              </div>
            </div>

            <h2>{card.value}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      {/* ANALYTICS */}
      <section className="reports-analytics-section">
        <div className="reports-section-title">
          <div>
            <span className="reports-eyebrow">PERFORMANCE</span>
            <h2>Sales Analytics</h2>
            <p>Visual overview of your sales performance.</p>
          </div>
        </div>

        <div className="reports-chart-grid">
          <BarChart
            title="Daily Revenue"
            data={dailyChartData}
            labelKey="chartLabel"
            valueKey="total_revenue"
            formatter={formatCurrency}
            type="purple"
          />

          <BarChart
            title="Monthly Revenue"
            data={monthlyChartData}
            labelKey="chartLabel"
            valueKey="total_revenue"
            formatter={formatCurrency}
            type="green"
          />

          <BarChart
            title="Paid vs Cancelled Orders"
            data={orderChartData}
            labelKey="name"
            valueKey="count"
            formatter={(value) => `${value} orders`}
            type="blue"
          />
        </div>
      </section>

      {/* DAILY REPORT */}
      <section className="reports-table-section">
        <div className="reports-section-title">
          <div>
            <span className="reports-eyebrow">DAILY PERFORMANCE</span>
            <h2>Daily Sales Report</h2>
            <p>Sales and revenue details for each day.</p>
          </div>

          <span className="reports-record-count">
            {dailySales.length} Records
          </span>
        </div>

        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Orders</th>
                <th>Total Revenue</th>
              </tr>
            </thead>

            <tbody>
              {dailySales.length > 0 ? (
                dailySales.map((sale, index) => (
                  <tr key={sale.date || index}>
                    <td className="reports-date-cell">
                      {formatDate(sale.date)}
                    </td>
                    <td>{sale.total_orders}</td>
                    <td className="reports-revenue-cell">
                      {formatCurrency(sale.total_revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="reports-empty-cell">
                    No daily sales data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MONTHLY REPORT */}
      <section className="reports-table-section">
        <div className="reports-section-title">
          <div>
            <span className="reports-eyebrow">MONTHLY PERFORMANCE</span>
            <h2>Monthly Sales Report</h2>
            <p>Monthly order and revenue summary.</p>
          </div>

          <span className="reports-record-count">
            {monthlySales.length} Records
          </span>
        </div>

        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Orders</th>
                <th>Total Revenue</th>
              </tr>
            </thead>

            <tbody>
              {monthlySales.length > 0 ? (
                monthlySales.map((sale, index) => (
                  <tr key={sale.month || index}>
                    <td className="reports-date-cell">
                      {formatMonth(sale.month)}
                    </td>
                    <td>{sale.total_orders}</td>
                    <td className="reports-revenue-cell">
                      {formatCurrency(sale.total_revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="reports-empty-cell">
                    No monthly sales data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default SalesReports;
