import { ArrowRightIcon } from '@radix-ui/react-icons';

import { cn } from '@/lib/utils';

const BentoGrid = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('grid w-full auto-rows-[22rem] grid-cols-3 gap-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  target,
  rel,
  onActivate,
  ...props
}) => (
  <div
    className={cn(
      'group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-xl',
      'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
      'transform-gpu dark:bg-background dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
      className
    )}
    {...props}
  >
    <div className="absolute inset-0">{background}</div>
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background:
          'radial-gradient(120% 90% at 0% 100%, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 28%, rgba(0,0,0,0.28) 48%, transparent 70%)',
      }}
    />

    <div className="relative z-10 p-4">
      <div className="pointer-events-none z-10 flex max-w-sm transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-10">
        <Icon className="h-12 w-12 origin-left transform-gpu text-white transition-all duration-300 ease-in-out group-hover:scale-75" />
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="max-w-lg text-white/70">{description}</p>
      </div>

      <div className="pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden">
        <a
          href={href}
          target={target}
          rel={rel}
          className="pointer-events-auto inline-flex items-center gap-2 p-0 text-sm font-medium text-white underline-offset-4 hover:underline"
        >
          {cta}
          <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
        </a>
      </div>
    </div>

    <div className="pointer-events-none absolute bottom-0 left-0 z-10 hidden w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
      <a
        href={href}
        target={target}
        rel={rel}
        className="pointer-events-auto inline-flex items-center gap-2 p-0 text-sm font-medium text-white underline-offset-4 hover:underline"
      >
        {cta}
        <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
      </a>
    </div>

    <div className="pointer-events-none absolute inset-0 z-[6] transform-gpu transition-all duration-300 group-hover:bg-black/10" />
    {typeof onActivate === 'function' ? (
      <button
        type="button"
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={onActivate}
        aria-label={cta || name}
      />
    ) : null}
  </div>
);

export { BentoCard, BentoGrid };
