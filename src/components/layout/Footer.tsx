const INSTAGRAM_URL =
  "https://www.instagram.com/uniport_official_?igsh=YWw4cWw2cmQ0ZnFj&utm_source=ig_contact_invite";

/**
 * 앱 하단 푸터. 인스타그램 링크.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          aria-label="유니포트 인스타그램"
        >
          <i className="ri-instagram-line text-lg" aria-hidden />
          <span>@uniport_official_</span>
        </a>
      </div>
    </footer>
  );
}
