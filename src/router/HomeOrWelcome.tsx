import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import WelcomePage from "../pages/welcome/page";

const INSTAGRAM_URL =
  "https://www.instagram.com/uniport_official_?igsh=YWw4cWw2cmQ0ZnFj&utm_source=ig_contact_invite";

export default function HomeOrWelcome() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/stock" replace />;
  }

  return (
    <>
      <WelcomePage />
      <footer className="mt-auto border-t border-gray-200 bg-white py-6 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-gray-600 transition-colors hover:text-teal-600"
            aria-label="Uniport Instagram"
          >
            <i className="ri-instagram-line text-2xl" aria-hidden />
            <span className="text-sm font-medium">@uniport_official_</span>
          </a>
        </div>
      </footer>
    </>
  );
}
