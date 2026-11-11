
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import "./Billing.css";

function Billing() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [createdInvoice, setCreatedInvoice] = useState(null);

  const [upiReference, setUpiReference] = useState("");
  const [submittingReference, setSubmittingReference] = useState(false);
  const [referenceMessage, setReferenceMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const fetchCustomers = async () => {
    const response = await api.get("customers/");
    setCustomers(response.data.results || response.data);
  };

  const fetchProducts = async () => {
    const response = await api.get("products/");
    setProducts(response.data.results || response.data);
  };

  const fetchInvoices = async () => {
    const response = await api.get("invoices/");
    setInvoices(response.data.results || response.data);
  };

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchCustomers(),
          fetchProducts(),
          fetchInvoices(),
        ]);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Billing data load nahi ho paaya."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  const addProduct = () => {
    setError("");

    if (!selectedProduct) {
      setError("Please select a product!");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number!");
      return;
    }

    const existingItem = items.find(
      (item) => item.product === selectedProduct.id
    );

    const alreadyAdded = existingItem
      ? existingItem.quantity
      : 0;

    if (alreadyAdded + qty > selectedProduct.quantity) {
      setError(
        `Available stock for ${selectedProduct.name}: ${selectedProduct.quantity}`
      );
      return;
    }

    if (existingItem) {
      setItems(
        items.map((item) =>
          item.product === selectedProduct.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          product: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: qty,
          price: Number(selectedProduct.price),
        },
      ]);
    }

    setProductId("");
    setQuantity(1);
  };

  const removeProduct = (id) => {
    setItems(items.filter((item) => item.product !== id));
  };

  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );

  const createInvoice = async () => {
    setError("");
    setCreatedInvoice(null);
    setUpiReference("");
    setReferenceMessage("");

    if (!customerId) {
      setError("Please select a customer!");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one product!");
      return;
    }

    try {
      setLoading(true);

      const invoiceData = {
        customer: Number(customerId),
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      };

      const response = await api.post(
        "invoices/create/",
        invoiceData
      );

      if (paymentMethod === "UPI") {
        setCreatedInvoice(response.data);
      }

      alert(
        `Invoice created successfully! Invoice Number: ${response.data.invoice_number}`
      );

      setCustomerId("");
      setItems([]);
      setProductId("");
      setQuantity(1);
      setPaymentMethod("Cash");

      await Promise.all([
        fetchInvoices(),
        fetchProducts(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        JSON.stringify(
          err.response?.data || "Invoice create nahi hua."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const submitUPIReference = async () => {
    setError("");
    setReferenceMessage("");

    const reference = upiReference.trim();

    if (!createdInvoice) {
      setError("Invoice not found.");
      return;
    }

    if (!reference) {
      setError("Please enter your UPI transaction reference.");
      return;
    }

    if (reference.length > 100) {
      setError("Reference must not exceed 100 characters.");
      return;
    }

    try {
      setSubmittingReference(true);

      const response = await api.post(
        `invoices/${createdInvoice.id}/upi-reference/`,
        {
          upi_reference: reference,
        }
      );

      setCreatedInvoice(response.data.invoice);

      setReferenceMessage(
        "UPI reference submitted successfully. Awaiting admin verification."
      );

      setUpiReference("");

      await fetchInvoices();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        JSON.stringify(
          err.response?.data || "UPI reference submit nahi hua."
        )
      );
    } finally {
      setSubmittingReference(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    setError("");

    if (newStatus === "Cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this invoice? Stock will be restored."
      );

      if (!confirmed) return;
    }

    try {
      setLoading(true);

      await api.patch(
        `invoices/${invoiceId}/status/`,
        { status: newStatus }
      );

      alert(`Invoice status updated to ${newStatus}!`);

      await Promise.all([
        fetchInvoices(),
        fetchProducts(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        JSON.stringify(
          err.response?.data || "Status update failed."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const response = await api.get(
        `invoices/${invoiceId}/pdf/`,
        { responseType: "blob" }
      );

      const fileURL = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        })
      );

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `${invoiceNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      setError("PDF download nahi ho paaya.");
    }
  };

  const upiId = import.meta.env.VITE_UPI_ID;
  const upiName =
    import.meta.env.VITE_UPI_NAME || "Smart Inventory";

  const upiPaymentLink = createdInvoice
    ? `upi://pay?${new URLSearchParams({
        pa: upiId || "",
        pn: upiName,
        am: Number(createdInvoice.total_amount).toFixed(2),
        cu: "INR",
        tn: `Invoice ${createdInvoice.invoice_number}`,
      }).toString()}`
    : "";

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "billing-status-paid";
      case "Pending":
        return "billing-status-pending";
      case "Cancelled":
        return "billing-status-cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="billing-page">

      {/* PAGE HEADER */}
      <section className="billing-heading">
        <div>
          <span className="billing-eyebrow">
            SALES & PAYMENTS
          </span>
          <h1>Billing & Invoices</h1>
          <p>
            Create invoices, process payments and manage billing history.
          </p>
        </div>

        <div className="billing-heading-stat">
          <div className="billing-heading-icon">▤</div>
          <div>
            <span>Total Invoices</span>
            <strong>{invoices.length}</strong>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="billing-error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="billing-loading-line">
          <div className="billing-loader-small"></div>
          <span>Processing your request...</span>
        </div>
      )}

      {/* CREATE INVOICE */}
      <section className="billing-card">
        <div className="billing-section-heading">
          <div>
            <span className="billing-step">STEP 01</span>
            <h2>Create New Invoice</h2>
            <p>Select a customer and payment method.</p>
          </div>
          <div className="billing-section-icon">＋</div>
        </div>

        <div className="billing-customer-payment-grid">
          <div className="billing-field">
            <label htmlFor="billing-customer">
              Select Customer *
            </label>
            <select
              id="billing-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="billing-field">
            <label htmlFor="billing-payment">
              Payment Method
            </label>
            <select
              id="billing-payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>
      </section>

      {/* ADD PRODUCTS */}
      <section className="billing-card">
        <div className="billing-section-heading">
          <div>
            <span className="billing-step">STEP 02</span>
            <h2>Add Products</h2>
            <p>Choose products and specify the required quantity.</p>
          </div>
          <div className="billing-section-icon">▦</div>
        </div>

        <div className="billing-product-entry">
          <div className="billing-field billing-product-select">
            <label htmlFor="billing-product">
              Select Product
            </label>
            <select
              id="billing-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">-- Select Product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} | {formatCurrency(product.price)} | Stock: {product.quantity}
                </option>
              ))}
            </select>
          </div>

          <div className="billing-field billing-quantity-field">
            <label htmlFor="billing-quantity">
              Quantity
            </label>
            <input
              id="billing-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="billing-add-button"
            onClick={addProduct}
          >
            + Add Product
          </button>
        </div>

        {selectedProduct && (
          <div className="billing-stock-info">
            <span>
              Selected: <strong>{selectedProduct.name}</strong>
            </span>
            <span>
              Unit Price: <strong>{formatCurrency(selectedProduct.price)}</strong>
            </span>
            <span>
              Available Stock: <strong>{selectedProduct.quantity}</strong>
            </span>
          </div>
        )}
      </section>

      {/* ADDED PRODUCTS */}
      <section className="billing-card">
        <div className="billing-section-heading">
          <div>
            <span className="billing-step">STEP 03</span>
            <h2>Invoice Items</h2>
            <p>Review products before creating the invoice.</p>
          </div>
          <span className="billing-items-count">
            {items.length} Items
          </span>
        </div>

        {items.length === 0 ? (
          <div className="billing-empty-items">
            <div>▤</div>
            <h3>No products added yet</h3>
            <p>Select a product above to start building your invoice.</p>
          </div>
        ) : (
          <div className="billing-table-wrapper">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>QUANTITY</th>
                  <th>UNIT PRICE</th>
                  <th>LINE TOTAL</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product}>
                    <td>
                      <strong className="billing-item-name">
                        {item.productName}
                      </strong>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td className="billing-line-total">
                      {formatCurrency(item.quantity * item.price)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="billing-remove-button"
                        onClick={() => removeProduct(item.product)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* INVOICE SUMMARY */}
      <section className="billing-summary-card">
        <div>
          <span className="billing-step">STEP 04</span>
          <h2>Invoice Summary</h2>
          <p>Review the total amount before creating the invoice.</p>
        </div>

        <div className="billing-summary-total">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>

        <button
          type="button"
          className="billing-create-button"
          onClick={createInvoice}
          disabled={loading || items.length === 0}
        >
          {loading ? "Processing..." : "Create Invoice →"}
        </button>
      </section>

      {/* UPI PAYMENT */}
      {createdInvoice &&
        createdInvoice.payment_method === "UPI" && (
          <section className="billing-upi-card">
            <div className="billing-section-heading">
              <div>
                <span className="billing-step">PAYMENT</span>
                <h2>UPI Payment</h2>
                <p>Pay using your UPI application.</p>
              </div>
              <div className="billing-upi-icon">₹</div>
            </div>

            <div className="billing-upi-content">
              <div className="billing-qr-area">
                {upiId ? (
                  <>
                    <QRCodeSVG
                      value={upiPaymentLink}
                      size={220}
                      level="H"
                    />
                    <p>Scan this QR code using any UPI app.</p>
                  </>
                ) : (
                  <p className="billing-upi-warning">
                    UPI ID is not configured. Please add VITE_UPI_ID in frontend/.env.
                  </p>
                )}
              </div>

              <div className="billing-upi-details">
                <div className="billing-upi-amount">
                  <span>Invoice Amount</span>
                  <strong>
                    {formatCurrency(createdInvoice.total_amount)}
                  </strong>
                </div>

                <div className="billing-upi-detail-row">
                  <span>Invoice Number</span>
                  <strong>{createdInvoice.invoice_number}</strong>
                </div>

                <div className="billing-upi-detail-row">
                  <span>UPI ID</span>
                  <strong>{upiId || "Not configured"}</strong>
                </div>

                <div className="billing-upi-divider"></div>

                <h3>Submit UPI Transaction Reference</h3>

                {createdInvoice.payment_verified ? (
                  <div className="billing-payment-verified">
                    ✓ Payment Verified Successfully!
                  </div>
                ) : createdInvoice.upi_reference ? (
                  <div className="billing-payment-pending">
                    Reference submitted: {createdInvoice.upi_reference}
                    <br />
                    Awaiting admin verification.
                  </div>
                ) : (
                  <>
                    <p>
                      Payment karne ke baad apna UPI Transaction ID / UTR enter karo.
                    </p>

                    <input
                      type="text"
                      placeholder="Enter UPI Transaction Reference"
                      value={upiReference}
                      maxLength={100}
                      onChange={(e) => setUpiReference(e.target.value)}
                    />

                    <button
                      type="button"
                      className="billing-reference-button"
                      onClick={submitUPIReference}
                      disabled={submittingReference}
                    >
                      {submittingReference
                        ? "Submitting..."
                        : "Submit UPI Reference"}
                    </button>
                  </>
                )}

                {referenceMessage && (
                  <p className="billing-reference-success">
                    {referenceMessage}
                  </p>
                )}

                <p className="billing-verification-note">
                  UTR submission does not confirm payment. Admin must verify the actual bank transaction.
                </p>
              </div>
            </div>
          </section>
        )}

      {/* INVOICE HISTORY */}
      <section className="billing-history-section">
        <div className="billing-section-heading">
          <div>
            <span className="billing-step">RECORDS</span>
            <h2>Invoice History</h2>
            <p>Review your previous invoices and payment status.</p>
          </div>

          <span className="billing-items-count">
            {invoices.length} Invoices
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="billing-empty-items">
            <div>▤</div>
            <h3>No invoices found</h3>
            <p>Your created invoices will appear here.</p>
          </div>
        ) : (
          <div className="billing-invoice-list">
            {invoices.map((invoice) => (
              <article className="billing-invoice-card" key={invoice.id}>

                <div className="billing-invoice-header">
                  <div>
                    <span className="billing-invoice-label">
                      INVOICE NUMBER
                    </span>
                    <h3>#{invoice.invoice_number}</h3>
                  </div>

                  <span
                    className={`billing-status ${getStatusClass(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="billing-invoice-meta">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {customers.find(
                        (customer) => customer.id === invoice.customer
                      )?.name || `Customer ID: ${invoice.customer}`}
                    </strong>
                  </div>

                  <div>
                    <span>Invoice Date</span>
                    <strong>
                      {new Date(invoice.invoice_date).toLocaleDateString("en-IN")}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Method</span>
                    <strong>{invoice.payment_method || "Cash"}</strong>
                  </div>

                  <div>
                    <span>Total Amount</span>
                    <strong className="billing-invoice-amount">
                      {formatCurrency(invoice.total_amount)}
                    </strong>
                  </div>
                </div>

                <div className="billing-invoice-products">
                  <h4>Invoice Products</h4>

                  {invoice.items.map((item) => (
                    <div className="billing-invoice-item" key={item.id}>
                      <span>Product ID: {item.product}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>Price: {formatCurrency(item.unit_price)}</span>
                      <strong>{formatCurrency(item.line_total)}</strong>
                    </div>
                  ))}
                </div>

                {invoice.payment_method === "UPI" && (
                  <div className="billing-invoice-upi">
                    <p>
                      <span>UPI Reference:</span>{" "}
                      {invoice.upi_reference || "Not submitted"}
                    </p>
                    <p>
                      <span>Verification:</span>{" "}
                      {invoice.payment_verified
                        ? "Verified"
                        : "Awaiting verification"}
                    </p>
                  </div>
                )}

                <div className="billing-invoice-footer">
                  <button
                    type="button"
                    className="billing-pdf-button"
                    onClick={() =>
                      downloadPDF(invoice.id, invoice.invoice_number)
                    }
                  >
                    ↓ Download PDF
                  </button>

                  {invoice.status === "Pending" && (
                    <div className="billing-status-control">
                      <label>Update Status</label>

                      <select
                        value={invoice.status}
                        onChange={(e) =>
                          updateInvoiceStatus(invoice.id, e.target.value)
                        }
                        disabled={
                          loading ||
                          (invoice.payment_method === "UPI" &&
                            !invoice.payment_verified)
                        }
                      >
                        <option value="Pending">Pending</option>

                        {invoice.payment_method !== "UPI" && (
                          <option value="Paid">Paid</option>
                        )}

                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {invoice.payment_method === "UPI" &&
                        !invoice.payment_verified && (
                          <span className="billing-admin-note">
                            UPI payment must be verified by admin before marking as Paid.
                          </span>
                        )}
                    </div>
                  )}
                </div>

              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default Billing;
