# Smart Inventory & Billing Management System
## Technical Project Documentation

### 1. Project Overview

The Smart Inventory & Billing Management System is a full-stack web application developed to simplify and manage daily inventory and billing operations.

The system allows businesses to manage products, categories, customers, invoices, stock quantities, and sales reports from a centralized platform.

It provides separate Admin and Staff roles with role-based access control. The application also supports UPI payment reference submission and Admin-side payment verification.

The frontend is developed using React, the backend uses Django REST Framework, and MySQL is used for database management.

### 2. Project Objectives

The main objectives of this project are:

1. To simplify product and inventory management.
2. To maintain accurate stock quantities.
3. To manage customer information.
4. To generate invoices automatically.
5. To reduce manual billing calculations.
6. To automatically update stock after billing.
7. To provide invoice cancellation with stock restoration.
8. To manage UPI payment verification.
9. To provide dashboard statistics and sales reports.
10. To implement secure authentication and role-based access.

### 3. Scope of the Project

The system provides the following major modules:

- User Authentication
- Role-Based Access Control
- Product Management
- Category Management
- Customer Management
- Inventory Management
- Billing and Invoice Management
- UPI Payment Management
- Dashboard
- Low Stock Alerts
- Sales Reports
- Invoice PDF Generation

### 4. Technology Overview

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Django | Backend framework |
| Django REST Framework | REST API development |
| React | Frontend development |
| Vite | Frontend development server and build tool |
| MySQL | Relational database |
| JWT | User authentication |
| Axios | Frontend API communication |
| React Router DOM | Frontend navigation |
| ReportLab | Invoice PDF generation |

### 5. User Roles

**Admin:**
- Manage products, categories, and customers.
- Create and manage invoices.
- Access dashboard and sales reports.
- Verify or reject UPI payment references.
- Access Admin-only features.

**Staff:**
- Manage products, categories, and customers.
- Create invoices and manage billing.
- View dashboard and invoice history.
- Submit UPI transaction references.
- Cannot access Admin-only sales reports or UPI verification features.


### 6. System Architecture

The Smart Inventory & Billing Management System follows a three-layer architecture:

1. **Frontend Layer:** React handles the user interface and user interactions.
2. **Backend Layer:** Django REST Framework handles business logic, authentication, permissions, and API requests.
3. **Database Layer:** MySQL stores application data such as users, products, categories, customers, invoices, and invoice items.

#### Architecture Diagram

```text
          ADMIN / STAFF
                |
                v
       REACT FRONTEND (VITE)
                |
                | HTTP Requests (Axios)
                | JWT Authentication
                v
       DJANGO REST FRAMEWORK
                |
        ---------------------
        |                   |
        v                   v
   BUSINESS LOGIC      PERMISSIONS
        |
        v
       MYSQL DATABASE
        |
        v
     API RESPONSE
        |
        v
       REACT UI
```

### 7. Application Workflow

The general application workflow is:

1. The user opens the React application.
2. The user enters login credentials.
3. React sends the login request to the Django backend.
4. Django validates the credentials.
5. The backend generates JWT access and refresh tokens.
6. The frontend stores the authentication tokens in local storage.
7. Axios attaches the access token to protected API requests.
8. Django validates authentication and user permissions.
9. The backend processes the requested operation.
10. MySQL stores or retrieves the required information.
11. Django sends the API response to React.
12. React updates the user interface.

### 8. Frontend and Backend Communication

The frontend and backend communicate using REST APIs.

**Frontend:**
- Developed using React.
- Uses Axios to send HTTP requests.
- Uses React Router DOM for navigation.
- Uses protected routes for authentication and Admin access.
- Uses local storage to maintain authentication tokens and role information.

**Backend:**
- Developed using Django REST Framework.
- Provides API endpoints for application modules.
- Uses serializers to validate and transform data.
- Uses permission classes to restrict access.
- Communicates with the MySQL database through Django ORM.

**API Base URL:**

```text
http://127.0.0.1:8000/api/
```

The frontend API base URL is configured in `frontend/src/api/axios.js`.

### 9. Database Design

The application uses MySQL as its relational database. Django ORM is used to define database models and manage database operations.

The main database entities are:

1. Category
2. Product
3. Customer
4. Invoice
5. InvoiceItem
6. User and Group (Django authentication system)

#### 9.1 Category Model

The Category model stores product category information.

| Field | Data Type | Description |
|---|---|---|
| id | AutoField | Primary key |
| name | CharField(100) | Category name |

**Purpose:** Organizes products into different categories.

#### 9.2 Product Model

The Product model stores product and inventory information.

| Field | Data Type | Description |
|---|---|---|
| id | AutoField | Primary key |
| name | CharField(200) | Product name |
| category | ForeignKey | Reference to Category |
| price | DecimalField(10,2) | Product price |
| quantity | PositiveIntegerField | Available stock |
| created_at | DateTimeField | Product creation date |

**Relationship:** Many Products can belong to one Category.

**Purpose:** Maintains product details, prices, and available stock quantities.

#### 9.3 Customer Model

The Customer model stores customer information.

| Field | Data Type | Description


### 12. Core Business Logic and Workflows

This section explains the main business operations implemented in the Smart Inventory & Billing Management System.

#### 12.1 Product and Stock Management

The Product module manages product information and available inventory.

**Workflow:**
1. Admin or Staff opens the Products module.
2. The user adds or updates product information.
3. The backend validates the submitted data.
4. Product information is stored in the MySQL database.
5. The updated product list is displayed on the frontend.

Each product maintains:
- Product name
- Category
- Price
- Available quantity
- Creation date

The system also provides low-stock alerts when product quantity is 10 or below.

#### 12.2 Invoice Creation and Billing

The Billing module allows users to generate invoices for customers.

**Workflow:**
1. Admin or Staff selects a customer.
2. The user selects products and their quantities.
3. The frontend sends invoice information to the backend.
4. The backend validates the submitted data.
5. Product quantities are grouped by product ID to calculate the required stock.
6. The backend locks the relevant product records using `select_for_update()`.
7. The system checks whether sufficient stock is available.
8. If stock is insufficient, invoice creation is rejected.
9. If stock is available, an invoice is created with a unique invoice number.
10. Invoice items are saved with their product quantities and unit prices.
11. The total invoice amount is calculated.
12. Product stock is automatically reduced.
13. The completed invoice is returned to the frontend.

**Billing Calculation:**

`Line Total = Quantity × Unit Price`

`Invoice Total = Sum of All Line Totals`

**Example:**

| Product | Quantity | Unit Price | Total |
|---|---:|---:|---:|


### 13. REST API Documentation

The backend uses Django REST Framework to provide RESTful APIs. The frontend communicates with these APIs using Axios.

**Base URL:**

```text
http://127.0.0.1:8000/api/
```

#### 13.1 Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/register/` | Register a new Staff user |
| POST | `/api/token/` | Obtain JWT access and refresh tokens |
| POST | `/api/token/refresh/` | Refresh an access token |
| POST | `/api/logout/` | Blacklist a refresh token |
| GET | `/api/me/` | Retrieve current user information |

#### 13.2 Product, Category and Customer APIs

| Endpoint | Purpose | Access |
|---|---|---|
| `/api/products/` | Product management | Admin, Staff |
| `/api/categories/` | Category management | Admin, Staff |
| `/api/customers/` | Customer management | Admin, Staff |

These endpoints use Django REST Framework ModelViewSets to support standard CRUD operations.

The Product API also supports:
- Search by product name.
- Filtering by category.
- Pagination.

#### 13.3 Invoice APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/invoices/create/` | Create a new invoice |
| GET | `/api/invoices/` | View invoice history |
| GET | `/api/invoices/<id>/` | Retrieve invoice details |
| PATCH | `/api/invoices/<id>/status/` | Update invoice status |
| GET | `/api/invoices/<id>/pdf/` | Download invoice PDF |

Invoice creation and history are accessible to Admin and Staff users.

#### 13.4 UPI Payment APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/invoices/<id>/upi-reference/` | Submit UPI reference | Admin, Staff |
| GET | `/api/admin/pending-upi-invoices/` | Retrieve pending UPI invoices | Admin |
| POST | `/api/invoices/<id>/verify-upi/` | Verify UPI payment | Admin |
| POST | `/api/invoices/<id>/reject-upi/` | Reject UPI reference | Admin |

#### 13.5 Dashboard and Reporting APIs

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/dashboard/` | Dashboard statistics | Admin, Staff |
| GET | `/api/low-stock/` | Low-stock products | Admin, Staff |
| GET | `/api/sales-report/` | Overall sales report | Admin |
| GET | `/api/daily-sales-report/` | Daily sales report | Admin |
| GET | `/api/monthly-sales-report/` | Monthly sales report | Admin |

#### 13.6 Authentication and Authorization

Protected API requests use JWT authentication.

The frontend sends the access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

The backend uses custom permission classes:

- `IsAdminOrStaff`: Allows authenticated Admin and Staff group members, along with superusers.
- `IsAdminGroup`: Allows authenticated Admin group members and superusers.

Unauthenticated requests are denied access to protected endpoints.

### 14. Frontend Architecture

The frontend of the Smart Inventory & Billing Management System is developed using React and Vite.

It provides an interactive user interface for Admin and Staff users to perform inventory and billing operations.

#### 14.1 Frontend Technologies

- React: Builds reusable UI components.
- Vite: Provides the frontend development server and build process.
- React Router DOM: Handles client-side navigation.
- Axios: Communicates with backend REST APIs.
- qrcode.react: Supports UPI QR code display.

#### 14.2 Frontend Modules

The application contains the following major pages:

| Module | Purpose |
|---|---|
| Login | User authentication |
| Dashboard | Displays inventory and billing statistics |
| Products | Product management |
| Categories | Category management |
| Customers | Customer management |
| Billing | Invoice creation and billing |
| Sales Reports | Admin sales reports |
| Admin UPI Verification | UPI payment verification and rejection |

#### 14.3 Frontend Routing

React Router DOM is used to manage application navigation.

The application uses two important route protection mechanisms:

**ProtectedRoute**
- Checks whether an access token exists in local storage.
- Redirects unauthenticated users to the Login page.
- Protects application pages from unauthenticated access.

**AdminRoute**
- Checks the user's role stored in local storage.
- Allows only Admin users to access Admin-only pages.
- Redirects other users to the Dashboard.

The frontend navigation also filters Admin-only links based on the user's role.

#### 14.4 Axios API Configuration

Axios is configured in:

`frontend/src/api/axios.js`

Its main responsibilities are:

1. Configure the backend API base URL.
2. Attach the JWT access token to outgoing API requests.
3. Handle unauthorized responses (HTTP 401).
4. Request a new access token using the refresh token.
5. Retry requests using the refreshed access token.
6. Clear authentication data and redirect to Login if token refresh fails.

The refresh mechanism uses a shared refresh promise to avoid multiple simultaneous token refresh requests.

#### 14.5 Authentication Workflow

The authentication workflow is:

1. User enters username and password.
2. Frontend sends credentials to the backend.
3. Backend validates the credentials.
4. Backend returns access and refresh tokens.
5. Frontend stores tokens and user role in local storage.
6. Protected pages become accessible.
7. Axios attaches the access token to API requests.
8. When the access token expires, Axios attempts to refresh it.
9. If refresh fails, the user is redirected to Login.

#### 14.6 Logout Workflow

When a user logs out:

- The application removes the access token.
- The refresh token is removed.
- The stored user role is removed.
- The user is redirected to the Login page.

### 15. Testing and Validation

The application was tested to verify its major features and business workflows.

The main testing areas include:

- User registration and login.
- JWT authentication and token refresh.
- Admin and Staff role-based access.
- Product, Category, and Customer operations.
- Product search, category filtering, and pagination.
- Invoice creation and total calculation.
- Stock availability validation.
- Automatic stock deduction.
- Invoice cancellation and stock restoration.
- UPI reference submission.
- Admin UPI payment verification and rejection.
- Dashboard statistics and low-stock alerts.
- Sales reports.
- Invoice PDF generation.

### 16. Error Handling

The backend uses Django REST Framework responses to communicate validation errors and unsuccessful operations.

Examples of handled situations include:

- Invalid login credentials.
- Unauthenticated API requests.
- Unauthorized role access.
- Product not found.
- Insufficient product stock.
- Invalid invoice status updates.
- Missing UPI transaction reference.
- Invalid UPI rejection reason.
- Attempt to verify an already verified payment.
- Attempt to cancel a Paid invoice.

Database transactions are used for critical billing, stock, and payment operations to maintain data consistency.

### 17. Security Implementation

The application includes the following security measures:

1. JWT-based authentication.
2. Backend role-based permissions.
3. Protected frontend routes.
4. Environment variables for sensitive configuration.
5. MySQL database integration.
6. Validation of API request data through serializers.
7. Database transactions for critical operations.
8. UPI verification restricted to Admin users and superusers.

### 18. Limitations

- The application is currently configured for local development.
- The frontend API base URL must be updated for a different backend deployment host.
- UPI payment verification requires manual Admin confirmation of the actual bank transaction.
- Production deployment and hosting configuration are not included in the current project setup.

### 19. Future Enhancements

Possible future improvements include:

- Production deployment.
- Advanced sales analytics.
- Additional reporting and filtering capabilities.
- Improved monitoring and operational logging.

### 20. Conclusion

The Smart Inventory & Billing Management System provides a centralized solution for product management, inventory tracking, customer management, billing, invoice generation, and sales reporting.

The application combines React, Django REST Framework, and MySQL to provide a full-stack system with JWT authentication and role-based access control.

Automated stock updates, invoice management,