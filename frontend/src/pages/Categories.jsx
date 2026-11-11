
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Categories.css";

function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("categories/");
      setCategories(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Categories load nahi ho paayi."
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

    fetchCategories();
  }, [navigate]);

  const resetForm = () => {
    setCategoryName("");
    setEditId(null);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setError("");

    const name = categoryName.trim();

    if (!name) {
      setError("Please enter category name!");
      return;
    }

    const exists = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editId
    );

    if (exists) {
      setError("Category already exists!");
      return;
    }

    try {
      if (editId !== null) {
        await api.put(`categories/${editId}/`, { name });
      } else {
        await api.post("categories/", { name });
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || "Category save nahi hui."
        )
      );
    }
  };

  const editCategory = (category) => {
    setCategoryName(category.name);
    setEditId(category.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteCategory = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`categories/${id}/`);

      if (editId === id) {
        resetForm();
      }

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        JSON.stringify(
          err.response?.data || "Category delete nahi hui."
        )
      );
    }
  };

  return (
    <div className="categories-page">

      {/* Header */}
      <section className="categories-heading">
        <div>
          <span className="categories-eyebrow">
            INVENTORY ORGANIZATION
          </span>

          <h1>Categories</h1>

          <p>
            Organize and manage your product categories.
          </p>
        </div>

        <div className="categories-total">
          <div className="categories-total-icon">▦</div>
          <div>
            <span>Total Categories</span>
            <strong>{categories.length}</strong>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="categories-error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Add / Edit Form */}
      <section className="category-form-card">
        <div className="category-section-header">
          <div>
            <h2>
              {editId !== null
                ? "Edit Category"
                : "Add New Category"}
            </h2>

            <p>
              {editId !== null
                ? "Update your category name."
                : "Create a category to organize your products."}
            </p>
          </div>

          <div className="category-form-icon">
            {editId !== null ? "✎" : "+"}
          </div>
        </div>

        <form
          className="category-form"
          onSubmit={saveCategory}
        >
          <div className="category-field">
            <label htmlFor="category-name">
              Category Name
            </label>

            <input
              id="category-name"
              type="text"
              placeholder="e.g. Electronics, Grocery, Clothing"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div className="category-form-actions">
            <button
              type="submit"
              className="category-primary-button"
              disabled={loading}
            >
              {editId !== null
                ? "Update Category"
                : "Add Category"}
            </button>

            {editId !== null && (
              <button
                type="button"
                className="category-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Category List */}
      <section className="category-list-section">

        <div className="category-section-header">
          <div>
            <h2>All Categories</h2>
            <p>
              Manage your existing product categories.
            </p>
          </div>

          <span className="category-count-badge">
            {categories.length} Categories
          </span>
        </div>

        {loading ? (
          <div className="categories-loading">
            <div className="categories-loader"></div>
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="categories-empty">
            <div className="categories-empty-icon">▦</div>
            <h3>No categories found</h3>
            <p>
              Add your first category using the form above.
            </p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category, index) => (
              <article
                className="category-card"
                key={category.id}
              >
                <div className="category-card-top">
                  <div className="category-card-icon">
                    {category.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="category-card-id">
                    #{category.id}
                  </span>
                </div>

                <div className="category-card-info">
                  <h3>{category.name}</h3>
                  <p>Product Category</p>
                </div>

                <div className="category-card-footer">
                  <span>Category {index + 1}</span>

                  <div className="category-card-actions">
                    <button
                      type="button"
                      className="category-edit-button"
                      onClick={() => editCategory(category)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="category-delete-button"
                      onClick={() => deleteCategory(category.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </section>

    </div>
  );
}

export default Categories;
