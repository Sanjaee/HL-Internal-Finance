src
│
├── app
│   │
│   ├── page.tsx                // redirect login/dashboard
│   ├── layout.tsx
│   │
│   ├── auth
│   │   └── login
│   │       └── page.tsx
│   │
│   ├── dashboard
│   │   └── page.tsx
│   │
│   ├── customers
│   │   ├── page.tsx
│   │   ├── create
│   │   │   └── page.tsx
│   │   └── [id]
│   │       └── page.tsx
│   │
│   ├── products
│   │   ├── page.tsx
│   │   ├── create
│   │   │   └── page.tsx
│   │   └── [id]
│   │       └── page.tsx
│   │
│   ├── transactions
│   │   ├── page.tsx
│   │   ├── create
│   │   │   └── page.tsx
│   │   └── [id]
│   │       └── page.tsx
│   │
│   ├── reports
│   │   └── page.tsx
│   │
│   └── api
│       └── auth
│           └── [...nextauth]
│
├── components
│   │
│   ├── app-sidebar.tsx
│   ├── app-header.tsx
│   ├── page-header.tsx
│   │
│   ├── customer-form.tsx
│   ├── product-form.tsx
│   ├── transaction-form.tsx
│   │
│   ├── customer-table.tsx
│   ├── product-table.tsx
│   ├── transaction-table.tsx
│   │
│   └── charts
│       ├── omzet-chart.tsx
│       └── lm-br-chart.tsx
│
├── lib
│   ├── auth.ts
│   ├── db.ts
│   ├── calculations.ts
│   └── utils.ts
│
├── actions
│   ├── customer-actions.ts
│   ├── product-actions.ts
│   ├── transaction-actions.ts
│   └── report-actions.ts
│
├── schemas
│   ├── login.ts
│   ├── customer.ts
│   ├── product.ts
│   └── transaction.ts
│
├── types
│   └── index.ts
│
├── middleware.ts
│
└── auth.ts