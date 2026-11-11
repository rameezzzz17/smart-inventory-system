
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./AdminUPIVerification.css";

function AdminUPIVerification() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [confirmed, setConfirmed] = useState({});

  const fetchPendingInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("admin/pending-upi-invoices/");

      setInvoices(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load invoices. Please check admin login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  // VERIFY PAYMENT
  const verifyPayment = async (invoice) => {
    if (!confirmed[invoice.id]) {
      setError("Please confirm the actual bank transaction first.");
      return;
    }

    const accepted = window.confirm(
      `Have you checked the actual bank transaction for reference ${invoice.upi_reference}?`
    );

    if (!accepted) return;

    try {
      setVerifyingId(invoice.id);
      setError("");
      setMessage("");

      await api.post(
        `invoices/${invoice.id}/verify-upi/`,
        {
          bank_transaction_confirmed: true,
        }
      );

      setMessage(
        `Invoice ${invoice.invoice_number} verified successfully.`
      );

      setConfirmed((previous) => ({
        ...previous,
        [invoice.id]: false,
      }));

      await fetchPendingInvoices();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Payment verification failed."
      );
    } finally {
      setVerifyingId(null);
    }
  };

  // REJECT UPI REFERENCE
  const rejectPayment = async (invoice) => {
    const reason = window.prompt(
      `Enter rejection reason for invoice ${invoice.invoice_number}:`
    );

    if (reason === null) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError("Rejection reason is required.");
      return;
    }

    if (trimmedReason.length > 500) {
      setError("Rejection reason must not exceed 500 characters.");
      return;
    }

    const accepted = window.confirm(
      `Are you sure you want to reject the UPI reference for ${invoice.invoice_number}?\n\nReason: ${trimmedReason}\n\nInvoice will remain Pending and stock will not be restored.`
    );

    if (!accepted) return;

    try {
      setRejectingId(invoice.id);
      setError("");
      setMessage("");

      await api.post(
        `invoices/${invoice.id}/reject-upi/`,
        {
          reason: trimmedReason,
        }
      );

      setMessage(
        `UPI reference for invoice ${invoice.invoice_number} rejected successfully.`
      );

      setConfirmed((previous) => ({
        ...previous,
        [invoice.id]: false,
      }));

      await fetchPendingInvoices();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to reject UPI reference."
      );
    } finally {
      setRejectingId(null);
    }
  };

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });

  if (loading) {
    return (
      <div className="upi-admin-loading">
        <div className="upi-admin-loader"></div>
        <h3>Loading UPI Verification...</h3>
        <p>Fetching pending payment requests.</p>
      </div>
    );
  }

  return (
    <div className="upi-admin-page">

      {/* PAGE HEADER */}
      <section className="upi-admin-header">
        <div>
          <span className="upi-admin-eyebrow">
            ADMINISTRATION
          </span>

          <h1>UPI Payment Verification</h1>

          <p>
            Review submitted UPI references and verify actual bank
            transactions.
          </p>
        </div>

        <button
          className="upi-admin-refresh"
          onClick={fetchPendingInvoices}
          disabled={
            loading ||
            verifyingId !== null ||
            rejectingId !== null
          }
        >
          ↻ Refresh Invoices
        </button>
      </section>

      {/* NOTICES */}
      {error && (
        <div className="upi-admin-alert error">
          <span className="upi-admin-alert-icon">!</span>
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="upi-admin-alert success">
          <span className="upi-admin-alert-icon">✓</span>
          <p>{message}</p>
        </div>
      )}

      {/* SUMMARY */}
      <section className="upi-admin-summary">
        <div className="upi-admin-summary-icon">
          ₹
        </div>

        <div>
          <span>Pending Verification</span>
          <h2>{invoices.length}</h2>
          <p>UPI invoices awaiting admin review</p>
        </div>
      </section>

      {/* SECURITY NOTICE */}
      <section className="upi-admin-security">
        <div className="upi-admin-security-icon">!</div>

        <div>
          <h3>Important Payment Security Notice</h3>

          <p>
            A submitted UTR reference is not proof of payment.
            Always verify the actual transaction in your bank
            account or payment statement before approving an invoice.
          </p>
        </div>
      </section>

      {/* INVOICES */}
      <section className="upi-admin-invoices-section">
        <div className="upi-admin-section-heading">
          <div>
            <h2>Pending UPI Invoices</h2>
            <p>Review each payment before verification.</p>
          </div>

          <span className="upi-admin-count">
            {invoices.length} Pending
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="upi-admin-empty">
            <div className="upi-admin-empty-icon">✓</div>
            <h3>All caught up!</h3>
            <p>No pending UPI invoices found.</p>
          </div>
        ) : (
          <div className="upi-admin-invoice-grid">
            {invoices.map((invoice) => (
              <article
                className="upi-admin-invoice-card"
                key={invoice.id}
              >
                {/* INVOICE HEADER */}
                <div className="upi-admin-invoice-top">
                  <div>
                    <span className="upi-admin-invoice-label">
                      INVOICE NUMBER
                    </span>

                    <h3>{invoice.invoice_number}</h3>
                  </div>

                  <span className="upi-admin-pending-badge">
                    Pending
                  </span>
                </div>

                {/* AMOUNT */}
                <div className="upi-admin-amount-box">
                  <span>Invoice Amount</span>
                  <h2>{formatCurrency(invoice.total_amount)}</h2>
                </div>

                {/* DETAILS */}
                <div className="upi-admin-details">
                  <div className="upi-admin-detail-row">
                    <span>Invoice ID</span>
                    <strong>{invoice.id}</strong>
                  </div>

                  <div className="upi-admin-detail-row">
                    <span>Customer ID</span>
                    <strong>{invoice.customer}</strong>
                  </div>

                  <div className="upi-admin-detail-row">
                    <span>Payment Method</span>
                    <strong>{invoice.payment_method}</strong>
                  </div>

                  <div className="upi-admin-detail-row">
                    <span>Invoice Status</span>
                    <strong>{invoice.status}</strong>
                  </div>
                </div>

                {/* UPI REFERENCE */}
                <div className="upi-admin-utr-box">
                  <span>UPI / UTR Reference</span>
                  <strong>
                    {invoice.upi_reference || "Not provided"}
                  </strong>
                </div>

                {/* BANK CONFIRMATION */}
                <label className="upi-admin-confirm-label">
                  <input
                    type="checkbox"
                    checked={!!confirmed[invoice.id]}
                    onChange={(e) =>
                      setConfirmed((previous) => ({
                        ...previous,
                        [invoice.id]: e.target.checked,
                      }))
                    }
                  />

                  <span>
                    I have checked the actual bank transaction and
                    confirmed that this payment was received.
                  </span>
                </label>

                {/* VERIFY BUTTON */}
                <button
                  className="upi-admin-verify-button"
                  onClick={() => verifyPayment(invoice)}
                  disabled={
                    !confirmed[invoice.id] ||
                    verifyingId !== null ||
                    rejectingId !== null
                  }
                >
                  {verifyingId === invoice.id
                    ? "Verifying Payment..."
                    : "✓ Verify Payment"}
                </button>

                {/* REJECT BUTTON */}
                <button
                  type="button"
                  className="upi-admin-reject-button"
                  onClick={() => rejectPayment(invoice)}
                  disabled={
                    verifyingId !== null ||
                    rejectingId !== null
                  }
                >
                  {rejectingId === invoice.id
                    ? "Rejecting Reference..."
                    : "✕ Reject UPI Reference"}
                </button>

                <p className="upi-admin-card-footer">
                  Verification requires actual bank confirmation.
                  Rejection keeps the invoice Pending and does not
                  restore stock.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminUPIVerification;
