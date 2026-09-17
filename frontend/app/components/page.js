import { BentoDemo } from '@/components/BentoDemo';
import styles from '@/components/layout/AppShell.module.css';

export default function ComponentsPage() {
  return (
    <section className={styles.pageSection}>
      <div className="w-full py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Components
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Build and preview UI components here.
          </p>
        </div>
        <BentoDemo />
      </div>
    </section>
  );
}
