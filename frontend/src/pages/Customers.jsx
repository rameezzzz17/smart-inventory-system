
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Customers.css";

function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("customers/");
      setCustomers(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Customers load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    fetchCustomers();
  }, [navigate]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setEditId(null);
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    setError("");

    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    };

    try {
      if (editId !== null) {
        await api.put(`customers/${editId}/`, customerData);
      } else {
        await api.post("customers/", customerData);
      }

      resetForm();
      await fetchCustomers();
    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || "Customer save nahi hua."
        )
      );
    }
  };

  const editCustomer = (customer) => {
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
    setAddress(customer.address || "");
    setEditId(customer.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteCustomer = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this customer?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`customers/${id}/`);

      if (editId === id) {
        resetForm();
      }

      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Customer delete nahi hua."
      );
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (customerName) => {
    return customerName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  return (
    <div className="customers-page">

      {/* PAGE HEADER */}
      <section className="customers-heading">
        <div>
          <span className="customers-eyebrow">
            CUSTOMER MANAGEMENT
          </span>

          <h1>Customers</h1>

          <p>
            Manage your customer information and contact details.
          </p>
        </div>

        <div className="customers-total-card">
          <div className="customers-total-icon">♙</div>
          <div>
            <span>Total Customers</span>
            <strong>{customers.length}</strong>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="customers-error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* CUSTOMER FORM */}
      <section className="customer-form-card">
        <div className="customer-section-heading">
          <div>
            <h2>
              {editId !== null ? "Edit Customer" : "Add New Customer"}
            </h2>

            <p>
              {editId !== null
                ? "Update customer contact information."
                : "Enter customer details to add a new customer."}
            </p>
          </div>

          <div className="customer-form-icon">
            {editId !== null ? "✎" : "+"}
          </div>
        </div>

        <form className="customer-form" onSubmit={saveCustomer}>
          <div className="customer-form-grid">

            <div className="customer-field">
              <label htmlFor="customer-name">Customer Name *</label>
              <input
                id="customer-name"
                type="text"
                placeholder="Enter customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-phone">Phone Number *</label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-email">Email Address *</label>
              <input
                id="customer-email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-address">Address</label>
              <input
                id="customer-address"
                type="text"
                placeholder="Enter customer address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

          </div>

          <div className="customer-form-actions">
            <button
              type="submit"
              className="customer-primary-button"
              disabled={loading}
            >
              {editId !== null ? "Update Customer" : "Add Customer"}
            </button>

            {editId !== null && (
              <button
                type="button"
                className="customer-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* CUSTOMER LIST */}
      <section className="customer-list-section">

        <div className="customer-list-heading">
          <div>
            <h2>All Customers</h2>
            <p>View and manage your registered customers.</p>
          </div>

          <span className="customer-count-badge">
            {filteredCustomers.length} Results
          </span>
        </div>

        {/* SEARCH */}
        <div className="customer-search-box">
          <span className="customer-search-icon">⌕</span>

          <input
            type="text"
            placeholder="Search by customer name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="customer-clear-search"
            >
              Clear
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="customers-loading">
            <div className="customers-loader"></div>
            <p>Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="customers-empty">
            <div className="customers-empty-icon">♙</div>
            <h3>
              {search ? "No matching customers" : "No customers found"}
            </h3>
            <p>
              {search
                ? "Try searching with another name, phone or email."
                : "Add your first customer using the form above."}
            </p>
          </div>
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>PHONE</th>
                  <th>EMAIL</th>
                  <th>ADDRESS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-name-cell">
                        <div className="customer-avatar">
                          {getInitials(customer.name)}
                        </div>

                        <div>
                          <strong>{customer.name}</strong>
                          <span>Customer #{customer.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{customer.phone}</td>

                    <td>{customer.email}</td>

                    <td>
                      <span className="customer-address">
                        {customer.address || "Not provided"}
                      </span>
                    </td>

                    <td>
                      <div className="customer-table-actions">
                        <button
                          type="button"
                          className="customer-edit-button"
                          onClick={() => editCustomer(customer)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="customer-delete-button"
                          onClick={() => deleteCustomer(customer.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>
    </div>
  );
}

export default Customers;
