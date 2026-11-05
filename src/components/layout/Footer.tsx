export function Footer() {
  return (
  <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center px-6 shrink-0 text-slate-500 text-xs transition-colors">
    <p>© {new Date().getFullYear()} YelpCamp. All rights reserved.</p>
  </footer>
  );
}
