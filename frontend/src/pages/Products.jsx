
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Products.css";

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const fetchProducts = async (url = "products/") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(url);

      setProducts(response.data.results || []);
      setNextPage(response.data.next);
      setPreviousPage(response.data.previous);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Products load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("categories/");
      setCategories(response.data);

      if (response.data.length > 0) {
        setCategory(String(response.data[0].id));
      }
    } catch (err) {
      setError("Categories load nahi ho paayi.");
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    fetchProducts();
    fetchCategories();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const productData = {
      name,
      category: Number(category),
      price: Number(price),
      quantity: Number(quantity),
    };

    try {
      if (editId) {
        await api.put(`products/${editId}/`, productData);
      } else {
        await api.post("products/", productData);
      }

      resetForm();
      await fetchProducts();

    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || "Product save nahi hua."
        )
      );
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setName(product.name);
    setCategory(String(product.category));
    setPrice(product.price);
    setQuantity(String(product.quantity));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`products/${id}/`);
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Product delete nahi hua."
      );
    }
  };

  const resetForm = () => {
    setName("");
    setCategory(
      categories.length ? String(categories[0].id) : ""
    );
    setPrice("");
    setQuantity("");
    setEditId(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const query = search.trim();

    fetchProducts(
      query
        ? `products/?search=${encodeURIComponent(query)}`
        : "products/"
    );
  };

  return (
    <div className="products-page">

      {/* Page Header */}
      <section className="products-heading">
        <div>
          <span className="products-eyebrow">
            INVENTORY MANAGEMENT
          </span>

          <h1>Products</h1>

          <p>
            Manage your products, prices and available stock.
          </p>
        </div>

        <div className="products-total">
          <span>Products on this page</span>
          <strong>{products.length}</strong>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="products-error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Add / Edit Product Form */}
      <section className="product-form-card">
        <div className="products-section-header">
          <div>
            <h2>
              {editId ? "Edit Product" : "Add New Product"}
            </h2>

            <p>
              {editId
                ? "Update the selected product details."
                : "Enter the details to add a product to inventory."}
            </p>
          </div>

          <div className="form-header-icon">
            {editId ? "✎" : "+"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="product-form-grid">

            <div className="product-field">
              <label htmlFor="product-name">
                Product Name
              </label>

              <input
                id="product-name"
                type="text"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="product-field">
              <label htmlFor="product-category">
                Category
              </label>

              <select
                id="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-field">
              <label htmlFor="product-price">
                Price (₹)
              </label>

              <input
                id="product-price"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="product-field">
              <label htmlFor="product-quantity">
                Quantity
              </label>

              <input
                id="product-quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                required
              />
            </div>

          </div>

          <div className="product-form-actions">
            <button
              type="submit"
              className="product-primary-button"
              disabled={loading}
            >
              {editId ? "Update Product" : "Add Product"}
            </button>

            {editId && (
              <button
                type="button"
                className="product-secondary-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Product List */}
      <section className="product-list-section">

        <div className="products-section-header">
          <div>
            <h2>Product List</h2>
            <p>View and manage your inventory products.</p>
          </div>
        </div>

        {/* Search */}
        <form
          className="product-search-form"
          onSubmit={handleSearch}
        >
          <div className="product-search-input">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="product-search-button"
          >
            Search
          </button>

          <button
            type="button"
            className="product-clear-button"
            onClick={() => {
              setSearch("");
              fetchProducts();
            }}
          >
            Clear
          </button>
        </form>

        {/* Table */}
        <div className="product-table-card">
          {loading ? (
            <div className="products-loading">
              <div className="products-loader"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <div>▦</div>
              <h3>No products found</h3>
              <p>
                Add a new product or try another search.
              </p>
            </div>
          ) : (
            <div className="product-table-responsive">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const productCategory = categories.find(
                      (cat) => cat.id === product.category
                    );

                    return (
                      <tr key={product.id}>
                        <td>
                          <span className="products-id">
                            #{product.id}
                          </span>
                        </td>

                        <td className="products-name">
                          {product.name}
                        </td>

                        <td>
                          <span className="category-badge">
                            {productCategory?.name || product.category}
                          </span>
                        </td>

                        <td className="products-price">
                          {formatCurrency(product.price)}
                        </td>

                        <td>
                          <span className={
                            Number(product.quantity) === 0
                              ? "quantity-badge out-of-stock"
                              : Number(product.quantity) <= 5
                              ? "quantity-badge low-quantity"
                              : "quantity-badge available-quantity"
                          }>
                            {product.quantity}
                          </span>
                        </td>

                        <td>
                          <div className="product-action-buttons">
                            <button
                              className="product-edit-button"
                              onClick={() => handleEdit(product)}
                              type="button"
                            >
                              Edit
                            </button>

                            <button
                              className="product-delete-button"
                              onClick={() => handleDelete(product.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="products-pagination">
          <button
            disabled={!previousPage || loading}
            onClick={() => fetchProducts(previousPage)}
          >
            ← Previous
          </button>

          <span>Page navigation</span>

          <button
            disabled={!nextPage || loading}
            onClick={() => fetchProducts(nextPage)}
          >
            Next →
          </button>
        </div>

      </section>

    </div>
  );
}

export default Products;
