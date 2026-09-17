import Link from 'next/link';
import styles from './PlaceholderPage.module.css';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className={styles.section}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>
        {description}{' '}
        <Link href="/">Back to home</Link>
      </p>
    </div>
  );
}
