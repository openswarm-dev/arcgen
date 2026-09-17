import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  return (
    <>
      <a href="#main" className="srOnly">
        Skip to main content
      </a>
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.mainColumn}>
          <Navbar />
          <main id="main" className={styles.content}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
