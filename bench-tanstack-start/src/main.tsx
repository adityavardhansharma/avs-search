import './index.css';
import { createRoot } from 'react-dom/client';
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import IndexPage from './routes/index';

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});
const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

const el = document.getElementById('root');
if (el) createRoot(el).render(<RouterProvider router={router} />);
