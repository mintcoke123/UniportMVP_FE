import type { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Tournament from "../pages/tournament/page";
import Ranking from "../pages/ranking/page";
import ProtectedRoute from "./ProtectedRoute";

const GroupPortfolioPage = lazy(() => import("../pages/group-portfolio/page"));
const MockInvestmentPage = lazy(() => import("../pages/mock-investment/page"));
const StockDetailPage = lazy(() => import("../pages/stock-detail/page"));
const ChatPage = lazy(() => import("../pages/chat/page"));
const LoginPage = lazy(() => import("../pages/login/page"));
const SignupPage = lazy(() => import("../pages/signup/page"));
const FeedbackReportPage = lazy(() => import("../pages/feedback-report/page"));

const PageFallback = () => <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">로딩 중...</p></div>;

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/tournament",
    element: <ProtectedRoute><Tournament /></ProtectedRoute>,
  },
  {
    path: "/ranking",
    element: <Ranking />,
  },
  {
    path: "/group-portfolio",
    element: <GroupPortfolioPage />,
  },
  {
    path: "/mock-investment",
    element: <ProtectedRoute><Suspense fallback={<PageFallback />}><MockInvestmentPage /></Suspense></ProtectedRoute>,
  },
  {
    path: "/stock-detail",
    element: <StockDetailPage />,
  },
  {
    path: "/chat",
    element: <ProtectedRoute><Suspense fallback={<PageFallback />}><ChatPage /></Suspense></ProtectedRoute>,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/feedback-report",
    element: <FeedbackReportPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
