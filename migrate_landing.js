const fs = require('fs');

const mainHtml = fs.readFileSync('main.html', 'utf-8');

// Extract CSS (lines 59 to 889 roughly, or using regex)
const styleMatch = mainHtml.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  let css = styleMatch[1];
  // Remove global resets if any
  css = css.replace(/\*, \*\:\:before, \*\:\:after \{[^}]+\}/, '');
  css = css.replace(/body \{[\s\S]*?\}/, '');
  css = css.replace(/html \{[^}]+\}/, '');
  fs.writeFileSync('src/app/landing.css', css);
}

// Extract body content
const bodyMatch = mainHtml.match(/<main>([\s\S]*?)<\/main>/);
if (bodyMatch) {
  let html = bodyMatch[1];
  
  // Convert class= to className=
  html = html.replace(/class=/g, 'className=');
  // Close unclosed tags
  html = html.replace(/<br>/g, '<br />');
  html = html.replace(/<hr>/g, '<hr />');
  // Fix inline styles
  html = html.replace(/style="([^"]+)"/g, (match, p1) => {
    const styleObj = p1.split(';').filter(Boolean).reduce((acc, rule) => {
      let [key, val] = rule.split(':').map(s => s.trim());
      if(key && val) {
        key = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
        acc[key] = val;
      }
      return acc;
    }, {});
    return `style={${JSON.stringify(styleObj)}}`;
  });
  // Replace onclick
  html = html.replace(/onclick="([^"]+)"/g, '');

  const pageTsx = `
'use client';
import Link from 'next/link';
import './landing.css';
import { useEffect } from 'react';
import { Icon } from '@/components/Icon';

export default function LandingPage() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
  }, []);

  return (
    <>
      <main>
        ${html}
      </main>
      <footer role="contentinfo">
        <Link href="/" className="footer-logo">
          Запрошення <span className="footer-star">✦</span>
        </Link>
        <nav className="footer-links" aria-label="Посилання в футері">
          <Link href="/about">Про додаток</Link>
          <Link href="/privacy">Конфіденційність</Link>
          <Link href="/terms">Умови використання</Link>
        </nav>
        <p className="footer-copy">© 2025 Запрошення ✦. Всі права захищені.</p>
      </footer>
    </>
  );
}
`;
  fs.writeFileSync('src/app/page.tsx', pageTsx);
}

console.log('Migration script done');
