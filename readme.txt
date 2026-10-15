SHOPKART
========

ShopKart is a full-stack online shopping application. Customers can create an
account, browse a product catalog, save products to a wishlist, manage a
shopping cart, and place orders using Razorpay checkout.


FEATURES
--------

Customer accounts
  - Customer registration and login.
  - Password hashing with bcrypt.
  - JWT-based authentication using an HTTP-only cookie.
  - Authenticated profile lookup and logout.

Product catalog
  - Browse products and view individual product details.
  - Search products by name and filter by category.
  - Sort products by price, ascending or descending.
  - Track available stock for each product.

Shopping
  - Add products to a personal cart, change quantities, and remove items.
  - Cart operations validate product availability and stock limits.
  - Add and remove products from a personal wishlist.
  - Submit a shipping address and start a Razorpay payment.
  - Verify payment and view order history and individual order details.


TECHNOLOGY
----------

Frontend: React, Vite, React Router, Axios, and Tailwind CSS.
Backend: Node.js, Express, and Mongoose.
Database: MongoDB.
Payments: Razorpay.
Authentication: JSON Web Tokens and bcrypt.


PROJECT LAYOUT
--------------

backend/
  config/       Razorpay configuration
  controllers/  Customer, product, cart, wishlist, and order handlers
  middlewares/  Authentication middleware
  models/       Mongoose customer, product, and order models
  routes/       Express API routes
  utils/        Shared backend utilities
  index.js      Backend entry point
  seed.js       Sample product data loader

frontend/vite-project/
  src/
    components/ Shared interface components
    context/    Cart and wishlist state
    pages/      Login, registration, catalog, cart, checkout, and order pages
    services/   HTTP API client
  index.html    Vite application entry point

The backend and frontend are separate Node.js projects. Install and run each
from its own directory.


REQUIREMENTS
------------

 - Node.js and npm.
 - A MongoDB database (local or hosted).
 - Razorpay API credentials to use payment checkout.


CONFIGURATION
-------------

Create backend/.env with the following settings:

  URL=mongodb://127.0.0.1:27017/shopkart
  PORT=5000
  JWT_SECRET=replace-with-a-long-random-secret
  RAZORPAY_KEY_ID=your-razorpay-key-id
  RAZORPAY_KEY_SECRET=your-razorpay-key-secret

Use your own MongoDB connection string and Razorpay credentials. Do not commit
real credentials or secrets. Payment creation and verification require both
Razorpay settings.

Optionally create frontend/vite-project/.env to set the backend URL:

  VITE_API_URL=http://localhost:5000

When VITE_API_URL is omitted, the frontend uses http://localhost:5000. The
backend's local CORS allowlist currently includes ports 5173 and 5174.


RUN LOCALLY
-----------

1. Configure backend/.env and, if needed, frontend/vite-project/.env as
   described above.

2. Install backend dependencies and start the API. In PowerShell:

   cd backend
   npm install
   npm run dev

   The backend listens on the port configured by PORT (5000 in the example).

3. In a second terminal, install frontend dependencies and start Vite:

   cd frontend/vite-project
   npm install
   npm run dev

4. Open the local URL printed by Vite, normally http://localhost:5173.
   Register an account, sign in, and browse the catalog.

To run the backend without automatic restart, use npm start in backend.


SAMPLE PRODUCTS
---------------

To populate MongoDB with the sample catalog:

   cd backend
   npm run seed

IMPORTANT: The seed script deletes all existing Product documents before
inserting its sample products. Do not run it against a database whose product
data you need to preserve.


API OVERVIEW
------------

Customer routes:
  POST   /customers/register
  POST   /customers/login
  POST   /customers/logout
  GET    /customers/me                (authenticated)

Product routes:
  GET    /products
  GET    /products/:id
  POST   /products

  GET /products accepts optional search, category, and sort query parameters.
  sort supports price_asc and price_desc. The product creation route is
  available to clients; configure appropriate access controls before exposing
  an API publicly.

Authenticated wishlist routes:
  GET    /wishlist
  POST   /wishlist/:productId
  DELETE /wishlist/:productId

Authenticated cart routes:
  GET    /cart
  POST   /cart/:productId
  PATCH  /cart/:productId          JSON body: {"quantity": 2}
  DELETE /cart/:productId

Authenticated order routes:
  POST   /orders/create-payment-order
  POST   /orders/verify-payment
  GET    /orders
  GET    /orders/:id

Product, wishlist, cart, and order routes are also mounted under /api/products,
/api/wishlist, /api/cart, and /api/orders respectively. The frontend uses the
non-/api paths listed above.


DEVELOPMENT CHECKS
------------------

Build the frontend:

   cd frontend/vite-project
   npm run build

Check frontend lint:

   cd frontend/vite-project
   npm run lint

The backend package currently does not define an automated test suite.


NOTES
-----

 - Use Razorpay test credentials while developing and verify that payment
   configuration is present before trying checkout.
 - The frontend uses browser local storage for its interface's sign-in state;
   authenticated API requests are validated by the backend token.
 - A production deployment should use HTTPS, restrict CORS to the deployed
   frontend origin, protect product administration routes, and keep all
   credentials in the deployment environment rather than source control.
