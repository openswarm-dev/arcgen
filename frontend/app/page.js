import WarpText from '../components/WarpText';
import styles from '../components/layout/AppShell.module.css';

export default function Home() {
  return (
    <div className={styles.pageSection}>
      <div className={styles.hero}>
        <div className={styles.warpWrap}>
          <WarpText
            text="jowenrat"
            color="#f8f5ff"
            warpStrength={0.08}
            warpScale={1.7}
            speed={0.55}
            pointerInfluence={0.42}
            pointerStrength={0.38}
            refraction={0.018}
            ripple
            fontSize="clamp(2.25rem, 12vw, 9rem)"
            fontWeight={800}
            fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
            className={styles.warpSurface}
          />
        </div>
      </div>
    </div>
  );
}
