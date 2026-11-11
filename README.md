# Smart Inventory & Billing Management System

A full-stack web application designed to manage products, inventory, customers, billing, invoices, and sales reports. The system provides role-based access for Admin and Staff users, automated stock management, and UPI payment verification.

## Features

### Authentication & Role-Based Access
- JWT-based authentication.
- Admin and Staff roles.
- Protected frontend routes.
- Role-based access control for backend APIs.
- New registered users are automatically assigned the Staff role.

### Product & Category Management
- Add, view, update, and delete products.
- Manage product categories.
- Search products by name.
- Filter products by category.
- Paginated product listing.
- Track available stock and product prices.

### Customer Management
- Add, view, update, and delete customer records.
- Store customer name, email, phone, and address.

### Billing & Invoice Management
- Create invoices with multiple products.
- Automatically calculate invoice totals.
- Check product availability before billing.
- Automatically deduct stock after invoice creation.
- View invoice history.
- Update invoice status.
- Cancel eligible invoices and restore product stock.
- Generate and download invoice PDFs.

### UPI Payment Management
- Submit UPI transaction references.
- Admin verification of UPI payments.
- Admin can reject a UPI reference with a rejection reason.
- Rejected references can be replaced with a new reference.
- UPI invoices can be marked Paid only after successful admin verification.

### Dashboard & Reports
- Total products, customers, and invoices.
- Paid revenue and pending amount.
- Cancelled invoice count.
- Low-stock alerts.
- Sales reports.
- Daily and monthly sales reports.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, Django, Django REST Framework |
| Database | MySQL |
| Authentication | JWT |
| API Communication | Axios |
| Routing | React Router DOM |
| PDF Generation | ReportLab |
| UPI QR Code | qrcode.react |

## Project Structure

```text
smart-inventory-system/
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── ...
│
├── inventory/
│   ├── migrations/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── permissions.py
│   ├── pagination.py
│   └── urls.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rameezzzz17/smart-inventory-system.git
cd smart-inventory-system
```

### 2. Create and Activate Virtual Environment

Windows PowerShell:

```powershell
python -m venv venv
venv\Scripts\activate
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE smart_inventory;
```

### 5. Configure Environment Variables

Create a `.env` file in the project root directory using `.env.example` as a reference.

```env
DJANGO_SECRET_KEY=your-django-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=smart_inventory
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306
```

Replace the example values with your local configuration. Do not upload your actual `.env` file or secret credentials to GitHub.

### 6. Run Database Migrations

```bash
python manage.py migrate
```

### 7. Create an Admin User

```bash
python manage.py createsuperuser
```

The application uses Django groups named `Admin` and `Staff` for role-based permissions. Assign the appropriate group to users through Django Admin. Superusers have access to both permission levels.

### 8. Start the Backend Server

```bash
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000/
```

### 9. Configure the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` using `frontend/.env.example`:

```env
VITE_UPI_ID=your-upi-id
VITE_UPI_NAME=your-upi-name
```

The frontend API base URL is currently configured in `frontend/src/api/axios.js`. Update its `BASE_URL` constant if using a different backend host.

### 10. Start the Frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173/
```

Keep both backend and frontend terminals running while using the application.

## API Endpoints

The backend APIs are available under `/api/`.

| Module | Endpoint |
|---|---|
| Register | `POST /api/register/` |
| Login | `POST /api/token/` |
| Refresh Token | `POST /api/token/refresh/` |
| Logout | `POST /api/logout/` |
| Current User | `/api/me/` |
| Categories | `/api/categories/` |
| Products | `/api/products/` |
| Customers | `/api/customers/` |
| Invoices | `/api/invoices/` |
| Create Invoice | `POST /api/invoices/create/` |
| Update Invoice Status | `PATCH /api/invoices/<id>/status/` |
| Submit UPI Reference | `POST /api/invoices/<id>/upi-reference/` |
| Invoice PDF | `GET /api/invoices/<id>/pdf/` |
| Dashboard | `GET /api/dashboard/` |
| Low Stock | `GET /api/low-stock/` |
| Sales Report | `GET /api/sales-report/` |
| Daily Sales Report | `GET /api/daily-sales-report/` |
| Monthly Sales Report | `GET /api/monthly-sales-report/` |
| Pending UPI Invoices | `GET /api/admin/pending-upi-invoices/` |
| Verify UPI | `POST /api/invoices/<id>/verify-upi/` |
| Reject UPI | `POST /api/invoices/<id>/reject-upi/` |

## User Roles

### Admin
- Manage products, categories, and customers.
- Create and manage invoices.
- Access dashboard and sales reports.
- Verify or reject UPI transaction references.
- Access Admin-only features.

### Staff
- Manage products, categories, and customers.
- Create invoices and manage billing.
- View dashboard and invoice history.
- Submit UPI transaction references.
- Cannot access Admin-only reports or UPI verification features.

## Important Business Logic

- Stock is checked before creating an invoice.
- Stock deduction and invoice creation are handled within a database transaction.
- Cancelling an eligible invoice restores the associated product quantities.
- A Paid invoice cannot be cancelled directly.
- UPI payments require Admin verification before an invoice can become Paid.
- Rejecting a UPI reference does not cancel the invoice or restore stock. The invoice remains Pending until a valid new reference is submitted and verified.

## Security

- JWT authentication for protected APIs.
- Role-based backend permissions.
- Protected frontend routes.
- Environment variables for sensitive configuration.
- Database transactions for critical billing and stock operations.

## Future Scope

- Advanced sales analytics.
- Improved reporting and filtering.
- Deployment to a production server.

## Author

**Rameez Khan**

GitHub: https://github.com/rameezzzz17

---

**Project:** Smart Inventory & Billing Management System  
**Type:** Full-Stack Web Application