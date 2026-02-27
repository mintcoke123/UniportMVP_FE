import type { RouteObject } from "react-router-dom";
import { lazy } from "react";
import NotFound from "../pages/NotFound";
import HomeOrWelcome from "./HomeOrWelcome";
import Competition from "../pages/competition/page";
import Ranking from "../pages/ranking/page";
import ProtectedRoute from "./ProtectedRoute";
import AdminProtectedRoute from "./AdminProtectedRoute";
import Layout from "../components/layout/Layout";

const GroupPortfolioPage = lazy(() => import("../pages/group-portfolio/page"));
const MockInvestmentPage = lazy(() => import("../pages/mock-investment/page"));
const SoloPage = lazy(() => import("../pages/solo/page"));
const StockDetailPage = lazy(() => import("../pages/stock-detail/page"));
const ChatPage = lazy(() => import("../pages/chat/page"));
const LoginPage = lazy(() => import("../pages/login/page"));
const SignupPage = lazy(() => import("../pages/signup/page"));
const FeedbackReportPage = lazy(() => import("../pages/feedback-report/page"));
const MatchingRoomsPage = lazy(() => import("../pages/matching-rooms/page"));
const AdminPage = lazy(() => import("../pages/admin/page"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomeOrWelcome /> },
      { path: "competition", element: <Competition /> },
      { path: "ranking", element: <Ranking /> },
      { path: "group-portfolio", element: <GroupPortfolioPage /> },
      {
        path: "mock-investment",
        element: (
          <ProtectedRoute>
            <MockInvestmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "solo",
        element: (
          <ProtectedRoute>
            <SoloPage />
          </ProtectedRoute>
        ),
      },
      { path: "stock-detail", element: <StockDetailPage /> },
      {
        path: "chat",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      { path: "feedback-report", element: <FeedbackReportPage /> },
      {
        path: "matching-rooms",
        element: (
          <ProtectedRoute>
            <MatchingRoomsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "signup",
    element: <SignupPage />,
  },
  {
    path: "admin",
    element: (
      <AdminProtectedRoute>
        <AdminPage />
      </AdminProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
