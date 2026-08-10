# NexusMart — Multi-Vendor Marketplace

A premium, production-grade multi-vendor e-commerce marketplace built with React, Vite, Firebase, and Tailwind CSS. Fully static-exportable for GitHub Pages deployment.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **Backend/Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **State**: React Context + useReducer
- **Deployment**: GitHub Pages via GitHub Actions

## Architecture

```
/projects/multi-vendor-marketplace/
├── users/{userId}           # User profiles & roles
├── vendors/{vendorId}       # Vendor store data
├── products/{productId}     # Product listings
├── orders/{orderId}         # Order records
└── categories/{categoryId}  # Product categories
```

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/multi-vendor-marketplace.git
cd multi-vendor-marketplace
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Create a **Firestore Database** in test mode
4. Copy your config to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development

```bash
npm run dev
```

### 4. Deploy to GitHub Pages

```bash
npm run deploy
```

Or push to `main` — the GitHub Actions workflow handles it automatically.

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/multi-vendor-marketplace/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Role-Based Access

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse, cart, checkout, orders |
| **Vendor** | Product management, order fulfillment, sales dashboard |
| **Admin** | Platform overview, vendor verification, all data access |

## Modules

- **Authentication** — Email/password, role selection at signup
- **Storefront** — Product grid, category filtering, search, detailed product pages
- **Cart & Checkout** — Full cart management, order placement with tax/shipping calculation
- **Vendor Portal** — Add/edit/delete products, fulfill orders, sales analytics
- **Admin Panel** — Platform metrics, vendor management, order monitoring

## Project Structure

```
src/
├── components/
│   ├── layout/        # Header, Footer, Layout
│   ├── ui/            # Reusable UI components
│   ├── products/      # Product-specific components
│   ├── cart/          # Cart components
│   ├── auth/          # Auth components
│   ├── vendor/        # Vendor components
│   └── admin/         # Admin components
├── pages/             # Route pages
├── context/           # Auth & Cart contexts
├── hooks/             # Custom hooks
├── config/            # Firebase config & helpers
├── utils/             # Utility functions
└── assets/            # Static assets
```

## License

MIT
