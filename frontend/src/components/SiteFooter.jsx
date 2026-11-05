
import { Sparkles } from 'lucide-react'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <h2>
            Opportune
            <Sparkles size={19} strokeWidth={2.3} aria-hidden="true" />
          </h2>

          <p>
            Find opportunities. Stay prepared. Make your next move.
          </p>
        </div>

        <nav className="site-footer-links" aria-label="Footer navigation">
          <span>Useful links</span>
          <a href="/privacy">Privacy Policy</a>
          <a href="/cookies">Cookie Policy</a>
          <a href="/help">Help &amp; Tips</a>
          <a href="/">Opportune Homepage</a>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <div className="site-footer-inner">
          © {new Date().getFullYear()} Opportune. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
