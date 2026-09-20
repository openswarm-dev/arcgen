export const APP_NAME = 'F33D';
export const LOGO_SRC = '/logo/FeedLogo1.png';

export default function BrandLogo({ className, alt = APP_NAME }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_SRC} alt={alt} className={className} />
  );
}
