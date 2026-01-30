import type { RouteObject } from "react-router-dom";
import { lazy } from "react";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Tournament from "../pages/tournament/page";
import Ranking from "../pages/ranking/page";

const GroupPortfolioPage = lazy(() => import("../pages/group-portfolio/page"));
const MockInvestmentPage = lazy(() => import("../pages/mock-investment/page"));
const StockDetailPage = lazy(() => import("../pages/stock-detail/page"));
const ChatPage = lazy(() => import("../pages/chat/page"));
const LoginPage = lazy(() => import("../pages/login/page"));
const SignupPage = lazy(() => import("../pages/signup/page"));
const FeedbackReportPage = lazy(() => import("../pages/feedback-report/page"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/tournament",
    element: <Tournament />,
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
    element: <MockInvestmentPage />,
  },
  {
    path: "/stock-detail",
    element: <StockDetailPage />,
  },
  {
    path: "/chat",
    element: <ChatPage />,
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
