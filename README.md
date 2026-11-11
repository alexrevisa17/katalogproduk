# V8 App Template

A modern, production-ready web application template built with Vite, React, and TypeScript. Designed for AI-assisted development with component introspection, layout systems, and excellent developer experience.

## 🚀 Features

- **⚡ Lightning Fast**: Vite for instant hot module replacement and optimized builds
- **🎯 Type Safe**: Full TypeScript coverage across frontend and backend
- **🎨 Beautiful UI**: shadcn/ui components with Tailwind CSS
- **🧠 AI-Friendly**: Component introspection for AI development tools
- **📱 Responsive**: Mobile-first design with modern CSS
- **🔧 Developer Experience**: Hot reload, linting, formatting, and testing setup
- **🚀 Production Ready**: Server-side rendering (SSR), optimized builds, and deployment-ready

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern React with hooks and concurrent features
- **TypeScript 5** - Full type safety across the application
- **Vite 6** - Fast build tool and dev server with HMR
- **Tailwind CSS 3** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **React Router DOM 7** - Client-side routing
- **Motion** - Smooth animations and transitions

### Backend

- **Express API** - Health check, SSR, and extensible server routes
- **TypeScript** - Type-safe backend development

### Development Tools

- **ESLint 9** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Fast unit testing
- **TypeScript ESLint** - TypeScript-specific linting

> **Requirement:** Node.js 22 or later.

## 📁 Project Structure

```
v8-app-template/
├── src/
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui base components (40+ components)
│   │   └── Spinner.tsx
│   ├── layouts/          # Layout systems
│   │   ├── RootLayout.tsx    # Centralized layout wrapper
│   │   ├── Website.tsx       # Structural container
│   │   ├── Dashboard.tsx     # Dashboard layout
│   │   ├── RootLayout.md     # RootLayout documentation
│   │   ├── Website.md        # Website layout documentation
│   │   └── parts/            # Layout components
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── pages/            # Page components (content only)
│   │   ├── index.tsx     # Homepage
│   │   └── _404.tsx      # 404 page
│   ├── lib/              # Utilities and API
│   │   ├── utils.ts      # Utility functions
│   │   └── api-client.ts # API client
│   ├── server/           # Express API routes and SSR entry point
│   │   ├── api/health/GET.ts
│   │   └── entry.ts
│   ├── styles/           # Global styles
│   │   └── globals.css
│   ├── test/             # Test setup
│   │   └── setup.ts
│   ├── App.tsx           # Root application component
│   ├── main.tsx          # Application entry point
│   ├── router.ts         # Route definitions
│   └── routes.tsx        # Route components
├── dev-tools/            # Development mode enhancements
├── source-mapper/        # AI introspection plugin
├── public/               # Static assets
├── Dockerfile.dev        # Local Docker development image
└── vite.config.ts        # Vite, API, SSR, and plugin configuration
```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the client and SSR server bundle for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run Vitest unit tests
- `npm run test:ui` - Open the Vitest UI
- `npm run test:coverage` - Run tests with coverage reporting
- `npm run audit` - Check dependencies for high-severity vulnerabilities
- `npm run lint` - Run ESLint code linting
- `npm run lint:fix` - Run ESLint and apply fixes where possible
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format source files with Prettier
- `npm run clean` - Remove build output and Vite's dependency cache
- `npm run reset` - Clean the project and reinstall dependencies

## 🎨 UI Components

This template includes shadcn/ui components that are:

- **Accessible** - Built with Radix UI primitives
- **Customizable** - Easy to modify and extend
- **Consistent** - Design system with CSS variables
- **Copy-paste friendly** - Own your components

The template includes 40+ pre-configured shadcn/ui components:

- **Layout**: Card, Separator, Tabs, Sheet, Dialog
- **Forms**: Button, Input, Textarea, Select, Checkbox, Switch
- **Navigation**: Navigation Menu, Breadcrumb, Pagination
- **Feedback**: Alert, Badge, Progress, Skeleton, Sonner
- **Data Display**: Table, Avatar, Calendar, Hover Card
- **Overlays**: Popover, Tooltip, Alert Dialog, Drawer
- **Interactive**: Accordion, Collapsible, Command, Context Menu

To add new components:

```bash
npx shadcn-ui@latest add component-name
```

## 🧠 AI Integration

### Component Introspection

The custom source-mapper plugin adds metadata to components in development:

```html
<div
  data-source-file="/src/components/Button.tsx"
  data-source-line="15"
  data-source-component="Button"
>
  Click Me
</div>
```

### Development Mode Integration

The dev-tools package provides:

- **Element selection**: Click to identify components
- **Live editing**: Modify component props in real-time
- **Source mapping**: Navigate directly to component source
- **AI integration**: Enhanced context for AI development tools

### AI-Friendly Patterns

- **Consistent naming**: PascalCase components, camelCase hooks
- **Clear file structure**: Logical separation of concerns
- **Type-first approach**: Comprehensive TypeScript types
- **Standard patterns**: CRUD operations, form handling, error boundaries

## 🗃️ API & Layouts

### API Routes

The template includes:

- `GET /api/health` - Health check endpoint
- Extensible API client setup in `src/lib/api-client.ts`

### Layout System

**RootLayout Pattern** (recommended for multi-page sites):

`App.tsx` already wraps every route in RootLayout, which renders a shared header and footer on every page. Customize them by editing `src/layouts/parts/Header.tsx` and `Footer.tsx` directly — there is no config prop. For reference, the routing shape is a pathless layout route:

```tsx
// src/App.tsx (already wired)
const routeTree: RouteObject[] = [
  {
    element: (
      <RootLayout>
        <Outlet />
      </RootLayout>
    ),
    children: routes,
  },
];

const router = createAiroBrowserRouter(routeTree, { notFoundRouteId: 'airo-not-found' });

export default function App() {
  return <AiroRouterProvider router={router} />;
}
```

Pages become simple content components:

```tsx
// src/pages/home.tsx
export default function HomePage() {
  return <div>Your content here</div>;
}
```

**Available Layouts**:

- **RootLayout** (`src/layouts/RootLayout.tsx`) - Centralized header/footer wrapper
- **Website** (`src/layouts/Website.tsx`) - Structural container (used by RootLayout)
- **Dashboard** (`src/layouts/Dashboard.tsx`) - Admin panels and dashboards

See `src/layouts/*.md` for detailed usage documentation.

## 🧪 Testing

Run tests with:

```bash
npm run test
```

The template includes:

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Jest DOM** - Custom Jest matchers

## 📦 Deployment

### Build for production:

```bash
npm run build
```

### Deploy options:

- **Vercel/Netlify** - Frontend deployment
- **Railway/Render** - Full-stack deployment
- **Docker** - Containerized deployment

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
VITE_APP_NAME=v8 App Template
VITE_PUBLIC_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
NODE_ENV=development
PORT=3000
VITE_ENABLE_SOURCE_MAPPING=true
VITE_ENABLE_SSR=true
VITE_SHOW_DEV_TOOLS=false
```

### Custom Plugins

**Source Mapper Plugin**: Adds component introspection for AI tools
**Dev Tools Plugin**: Enables development mode enhancements
**Fullstory Integration**: Optional user analytics (configurable)

Configure in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sourceMapperPlugin from "./source-mapper/src/index";
import { devToolsPlugin } from "./dev-tools/src/vite-plugin";
import { fullStoryPlugin } from "./fullstory-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({ babel: { plugins: [sourceMapperPlugin] } }),
    ...(mode === "development" ? [devToolsPlugin(), fullStoryPlugin()] : []),
  ],
}));
```

## 🎯 Best Practices

### Component Architecture

- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into hooks
- Prefer function components with hooks

### State Management

- Keep local state in components with useState/useReducer
- Use React Context for app-wide state (theme, auth)
- Consider external libraries (Zustand, Redux Toolkit) for complex state
- Leverage layout props for shared configuration

### Layout Usage

- Use RootLayout for multi-page sites (configure in `App.tsx`)
- Pages should only contain content, not layout concerns
- Define header/footer once, applies to all pages
- Follow layout documentation in `src/layouts/*.md`
- Never duplicate header/footer config across pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run linting and tests
6. Submit a pull request

## 📄 License

MIT License - feel free to use this template for any project.

## 🙏 Acknowledgments

Built with amazing open-source tools:

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vitest](https://vitest.dev/)

---

**Happy coding! 🎉**


## Deploy ke Vercel (Bang Pray Store)

1. Gunakan Node.js **22.22.0 atau lebih baru** (versi proyek ditetapkan di `.nvmrc` dan `package.json`).
2. Import repository ke Vercel. Build command: `npm run build`; Output Directory: `dist/client`.
3. Tambahkan Environment Variables `ADMIN_PIN` dan `ADMIN_SESSION_SECRET`. Isi `ADMIN_PIN` dengan PIN pilihan (PIN yang diminta: `170990`). Buat `ADMIN_SESSION_SECRET` sebagai nilai acak rahasia minimal 32 karakter. Jangan commit file `.env`.
4. Deploy ulang setelah Environment Variables disimpan.

**Catatan penting Vercel:** login admin diverifikasi server-side melalui HttpOnly cookie. Namun penyimpanan file lokal tidak persisten pada Vercel Functions. Fitur upload file dan simpan pengaturan logo/WhatsApp sengaja mengembalikan pesan 503 yang jelas pada Vercel daripada berpura-pura berhasil. Agar kedua fitur tersebut permanen, hubungkan layanan storage/database persisten (misalnya Vercel Blob + database/KV). Data produk yang saat ini disimpan di `localStorage` juga hanya tersimpan di browser admin tersebut, bukan dibagikan otomatis ke semua pengunjung.

## PWA

Manifest, ikon, dan service worker tersedia di `public/`. Instalasi didukung pada browser yang memenuhi kriteria PWA; di Android Chrome gunakan menu **Install app** atau **Tambahkan ke layar utama** setelah situs dibuka melalui HTTPS.


## Supabase setup (required for production data)

1. In Supabase, open **SQL Editor** and run the SQL in `supabase/schema.sql`.
2. In **Storage**, create a public bucket named `product-images` (or run the bucket SQL included in the schema).
3. In Vercel → Project → Settings → Environment Variables, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PIN`, and `ADMIN_SESSION_SECRET` for Production (and Preview if needed). The service-role key is server-only: never put it in a `VITE_` variable or commit it to GitHub.
4. Redeploy the project. Open `/api/health` and `/api/products`; both should respond successfully.
5. Open `/admin`, sign in with the PIN configured in `ADMIN_PIN`, then add/edit products. Product catalog, store settings, and uploaded images are stored in Supabase, not browser localStorage.

### Supabase schema

See `supabase/schema.sql`. Product images are uploaded to the public `product-images` Storage bucket. The server uses the service-role key for database operations; admin write endpoints additionally require the signed HttpOnly admin session.
