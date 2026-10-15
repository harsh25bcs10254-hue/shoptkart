# ShopKart

ShopKart is a React/Vite storefront with an Express/Mongoose API. The storefront supports customer registration and login, product browsing, and a login-gated wishlist.

## Wishlist behavior

- The wishlist is available at `/wishlist`. Unauthenticated users are redirected to `/login`.
- The product listing (`/products`) and product detail routes (`/products/:id`) also require a login.
- After login, a user is returned to the protected route they originally requested. On a product detail page, they can then select **Add to Wishlist**.
- Wishlist membership is persisted on the authenticated customer document as Product ObjectIds; product details are populated from MongoDB when the wishlist is loaded.
- Adding an item uses `POST /wishlist/:productId`. Duplicate additions return `409`; the product card shows request, success, and error states without reloading.
- The wishlist page loads from `GET /wishlist`. It shows product image, name, price, category, stock, and a link to product details. **Remove from Wishlist** calls `DELETE /wishlist/:productId` and updates the page without reloading.
- Loading, error/retry, and empty-wishlist states are shown explicitly. **Continue shopping** and the empty-state button return to `/products`.
- `/cart` is retained as a compatibility route and redirects to `/wishlist`.
- Wishlist data is associated with the logged-in customer, so it can be retrieved across browsers after authentication. The frontend does not submit a customer ID; the backend identifies the customer from the JWT cookie or bearer token.

### Route and authentication details

`frontend/vite-project/src/App.jsx` uses the `shopkart-auth` local-storage value to decide whether protected pages can render. A failed route check redirects to login and carries the requested route in React Router location state. `Login` uses that state after successful authentication to navigate back.

Client-side route gating controls the UI, while the wishlist API independently requires the existing backend JWT authentication middleware. The `shopkart-auth` local-storage value is not an authorization boundary. Product API routes remain mounted without the backend auth middleware.

## Wishlist-related files and functions

Paths below are relative to this README's directory unless prefixed with `backend/`; backend paths are relative to the repository root.

| File | Function or export | Responsibility |
| --- | --- | --- |
| `src/App.jsx` | `App()` | Owns the client authentication flag and route table. Protects `/products`, `/products/:id`, `/wishlist`, and `/me`; redirects guests to login. Redirects legacy `/cart` requests to `/wishlist`. |
| `src/App.jsx` | `handleLogin()` | Writes `shopkart-auth=true` to local storage and updates React authentication state after successful login. |
| `src/App.jsx` | `handleLogout()` | Removes the client authentication flag and updates React state. The wishlist remains associated with the customer in MongoDB. |
| `src/pages/ProductDetails.jsx` | `ProductDetails({ isAuthenticated })` | Loads the product identified by the `:id` route parameter, shows load/error states and product details, and renders the wishlist action. |
| `src/pages/ProductDetails.jsx` | `handleAddToWishlist()` | Checks authentication and calls `addProductToWishlist(product._id)`. Shows request, success, or error feedback. The button is disabled when stock is zero or a request is in progress. |
| `src/pages/ProductDetails.jsx` | `useEffect` request | Calls `fetchProductById(id)` when the route ID changes. The cleanup guard prevents a stale request from updating state after the component is no longer current. |
| `src/pages/Cart.jsx` | `Wishlist()` | Kept in the existing page file, this component renders the backend-backed wishlist with loading, error/retry, empty, and product-list states. |
| `src/pages/Cart.jsx` | `loadWishlist()` | Calls `getWishlist()` and updates the wishlist page state. It is reused by the initial load and Try Again button. |
| `src/pages/Cart.jsx` | `removeItem(id)` | Calls `removeProductFromWishlist(id)` and removes the product from page state without a full-page reload. |
| `src/pages/Cart.jsx` | `formatPrice(price)` | Formats product prices as whole Indian rupees for the wishlist display. |
| `src/components/ProductCard.jsx` | `handleAddToWishlist()` | Calls `addProductToWishlist(product._id)`, prevents duplicate clicks while saving, and displays saving, added, or error status without reloading. |
| `src/components/Navbar.jsx` | `Navbar({ isAuthenticated, onLogout })` | Displays Home, Products, and Wishlist links for authenticated users. |
| `src/components/Navbar.jsx` | `handleLogout()` | Calls the logout API, then always invokes the parent logout handler and navigates to login. |
| `src/pages/Login.jsx` | `Login({ onLogin })` | Renders the login form and uses React Router location state to restore the protected destination after successful authentication (defaults to `/me`). |
| `src/pages/Login.jsx` | `handleChange(event)` | Updates the controlled email/password form fields. |
| `src/pages/Login.jsx` | `handleSubmit(event)` | Validates required values, submits credentials using `loginUser`, updates app authentication through `onLogin`, and navigates back to the requested location. Displays login errors and resets the submit state. |
| `src/services/api.js` | `api` | Axios client shared by the frontend. Uses `VITE_API_URL` or defaults to `http://localhost:5000`; sends credentials for cookie-based requests. |
| `src/services/api.js` | `fetchProductById(id)` | Fetches product details from `GET /products/:id`. |
| `src/services/api.js` | `getWishlist()` | Fetches the current customer's populated wishlist from `GET /wishlist`. |
| `src/services/api.js` | `addProductToWishlist(productId)` | Adds a product by ID using `POST /wishlist/:productId`; it does not send a customer ID. |
| `src/services/api.js` | `removeProductFromWishlist(productId)` | Removes a product using `DELETE /wishlist/:productId`; it does not send a customer ID. |
| `backend/models/customer.model.js` | `customerSchema.wishlist` | Stores Product ObjectIds only, with `ref: 'Product'` and default `[]`. Existing customer records remain valid. |
| `backend/models/product.model.js` | `Product` model | Registers the model as `Product` for wishlist population while retaining the existing `products` collection. |
| `backend/routes/wishlist.routes.js` | Wishlist routes | Applies `authMiddleware` to all wishlist endpoints, then maps `GET /`, `POST /:productId`, and `DELETE /:productId` to their controllers. |
| `backend/controllers/wishlist.controller.js` | `addProductToWishlist(req, res)` | Validates the product ID and existence, rejects duplicates, and saves the Product ObjectId to the authenticated customer's wishlist. |
| `backend/controllers/wishlist.controller.js` | `getWishlist(req, res)` | Populates the current customer's wishlist with `name`, `price`, `category`, `image`, and `stock`. |
| `backend/controllers/wishlist.controller.js` | `removeProductFromWishlist(req, res)` | Checks membership, removes only the requested product ID, and saves the authenticated customer. |
| `backend/index.js` | Express setup and route mounts | Mounts wishlist routes at `/wishlist`, in addition to existing product and customer routes. |
| `backend/routes/product.routes.js` | Product route declarations | Maps `GET /` and `GET /:id` to product-reading handlers; `POST /` creates a product. |
| `backend/controllers/product.controller.js` | `getAllProducts(req, res)` | Reads product filters (`search`, `category`, `sort`) and returns matching products. |
| `backend/controllers/product.controller.js` | `getProductById(req, res)` | Validates the MongoDB ObjectId and returns a product or an appropriate error response. |

`Products` and `ProductCard` are the entry to product details: `Products` loads the catalog through `fetchProducts`, while `ProductCard` links each item to `/products/:id`. `SearchBar` reports search, category, and sort changes to `Products`.

## Run locally

### Configure Razorpay

The checkout uses Razorpay Checkout in Test Mode. In the Razorpay Dashboard, create or view your Test Mode API keys, then copy `backend/.env.example` to `backend/.env` and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to your own keys. Keep the key secret in the backend environment only; it must not be added to frontend code or a `VITE_` variable. The backend sends the public key ID to the checkout page when it creates a payment order.

The backend also needs `URL` (your MongoDB connection string), `PORT` (defaults to `5000` in the frontend), and a private `JWT_SECRET`. If you use a different backend port, set the frontend `VITE_API_URL` to that backend URL (for example, `http://localhost:4020`). Restart the backend after changing `.env`. Without valid Razorpay keys, checkout will report that Razorpay is not configured.

Install dependencies in each project directory, then start the API and frontend in separate terminals:

```sh
cd backend
npm install
npm run dev
```

```sh
cd frontend/vite-project
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default. The backend defaults to port `5000`; set `PORT` to override it. Configure the backend environment with:

| Variable | Purpose |
| --- | --- |
| `URL` | MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/shoptkart`. |
| `PORT` | Optional Express listening port; defaults to `5000`. |
| `JWT_SECRET` | Required signing secret for customer authentication tokens. |
| `JWT_EXPIRES_IN` | Optional token lifetime; defaults to `7d`. |
| `NODE_ENV` | Set to `production` to mark the authentication cookie secure. |

Optionally set `VITE_API_URL` in the frontend environment to point the Axios client at a non-default API origin.

## Useful commands

Run these commands from `frontend/vite-project`:

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

Run these commands from `backend`:

```sh
npm run dev
npm start
npm run seed
```
