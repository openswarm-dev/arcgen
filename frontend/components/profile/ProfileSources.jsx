'use client';

import { Children, cloneElement } from 'react';

import { cn } from '@/lib/utils';
import { AnimatedList } from '@/registry/magicui/animated-list';
import { BentoCard, BentoGrid } from '@/registry/magicui/bento-grid';
import { Marquee } from '@/registry/magicui/marquee';
import { SOURCE_LAYOUT, sourceAnchorId } from './platforms';
import { getSourceItems } from './sourceItems';
import {
  FomoIcon,
  InstagramIcon,
  KickIcon,
  PumpFunIcon,
  RedditIcon,
  TikTokIcon,
  TwitchIcon,
  XIcon,
  YouTubeIcon
} from './platformIcons';

const ICONS = {
  twitch: TwitchIcon,
  kick: KickIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  instagram: InstagramIcon,
  reddit: RedditIcon,
  pumpfun: PumpFunIcon,
  fomo: FomoIcon
};

function PlayGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function DiagonalGrid({ children, columns = 3, rows = 2, duration = '32s' }) {
  const source = Children.toArray(children);
  if (!source.length) return null;

  const count = columns * rows;
  const cells = Array.from({ length: count }, (_, index) => {
    const child = source[index % source.length];
    return cloneElement(child, { key: `${child.key ?? 'cell'}-${index}` });
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-0 top-0 grid h-[200%] w-[200%] grid-cols-2 grid-rows-2 animate-marquee-diagonal will-change-transform group-hover:[animation-play-state:paused]"
        style={{ '--duration': duration }}
      >
        {[0, 1, 2, 3].map(copy => (
          <div
            key={copy}
            className="grid h-full min-h-0 min-w-0 gap-2 p-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {cells}
          </div>
        ))}
      </div>
    </div>
  );
}

function OppositeRows({ children, rows = 4, duration = '56s' }) {
  const source = Children.toArray(children);
  if (!source.length) return null;

  const loop = Array.from({ length: Math.max(8, source.length * 2) }, (_, index) => {
    const child = source[index % source.length];
    return cloneElement(child, { key: `${child.key ?? 'cell'}-${index}` });
  });

  return (
    <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden p-2">
      {Array.from({ length: rows }).map((_, row) => {
        const offset = loop.slice(row).concat(loop.slice(0, row));
        return (
          <Marquee
            key={row}
            reverse={row % 2 === 1}
            pauseOnHover
            repeat={4}
            className="min-h-0 flex-1 p-0 [--gap:0.5rem] [&>div]:h-full"
            style={{ '--duration': duration }}
          >
            {offset}
          </Marquee>
        );
      })}
    </div>
  );
}

function ThumbnailCard({ item, youtube = false, liveColor }) {
  return (
    <figure
      className={cn(
        'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[.04]',
        'transform-gpu blur-[0.4px] transition-all duration-300 ease-out hover:blur-none'
      )}
    >
      <div className="relative min-h-0 flex-1 bg-neutral-950">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
        {item.live ? (
          <span
            className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: liveColor }}
          >
            LIVE
          </span>
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center">
          {youtube ? (
            <span className="flex h-7 w-10 items-center justify-center rounded-md bg-red-600 text-white shadow">
              <PlayGlyph className="ml-0.5 h-3 w-3" />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white">
              <PlayGlyph className="ml-px h-3.5 w-3.5" />
            </span>
          )}
        </span>
      </div>
      <figcaption className="shrink-0 p-2">
        <p className="line-clamp-1 text-[11px] font-medium leading-4 text-white">{item.title}</p>
        {item.meta ? <p className="mt-0.5 text-[10px] text-neutral-500">{item.meta}</p> : null}
      </figcaption>
    </figure>
  );
}

function PortraitCard({ item }) {
  return (
    <figure
      className={cn(
        'relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950',
        'transform-gpu blur-[0.4px] transition-all duration-300 ease-out hover:blur-none'
      )}
    >
      {item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #25F4EE33, transparent 30%, #FE2C5533), radial-gradient(circle at 40% 30%, #1f2937, #050505)'
          }}
        />
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-2.5">
        <p className="line-clamp-2 text-[11px] font-medium text-white">{item.title}</p>
        {item.subtitle ? <p className="mt-1 line-clamp-2 text-[10px] text-white/70">{item.subtitle}</p> : null}
      </figcaption>
    </figure>
  );
}

function ImageCard({ item }) {
  return (
    <figure
      className={cn(
        'relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900',
        'transform-gpu blur-[0.4px] transition-all duration-300 ease-out hover:blur-none'
      )}
    >
      <div className="h-full w-full">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-yellow-500 via-pink-500 to-purple-700 px-2 text-center text-[10px] text-white">
            {item.title}
          </div>
        )}
      </div>
    </figure>
  );
}

function TweetCard({ text, time, likes, title, meta }) {
  return (
    <figure
      className={cn(
        'relative h-full w-56 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[.04] p-3',
        'transform-gpu blur-[0.4px] transition-all duration-300 ease-out hover:blur-none'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-white">Post</span>
        <span className="text-[10px] text-neutral-500">{time || meta}</span>
      </div>
      <blockquote className="mt-2 line-clamp-4 text-xs leading-5 text-neutral-300">{text || title}</blockquote>
      {likes ? <p className="mt-2 text-[10px] text-neutral-500">{likes} likes</p> : null}
    </figure>
  );
}

function RedditCard({ sub, title, votes, subtitle, meta }) {
  return (
    <figure className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-white/[.04] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-orange-400">{sub || subtitle}</p>
      <p className="mt-1 text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-[11px] text-neutral-500">{votes ? `${votes} upvotes` : meta}</p>
    </figure>
  );
}

function StatCard({ title, subtitle, meta }) {
  return (
    <figure
      className={cn(
        'relative h-full w-full overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3',
        'transform-gpu blur-[0.4px] transition-all duration-300 ease-out hover:blur-none'
      )}
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-neutral-400">{subtitle}</p> : null}
      {meta ? <p className="mt-3 text-xs text-emerald-400">{meta}</p> : null}
    </figure>
  );
}

function TradeRow({ action, token, pnl, time, title, subtitle, meta }) {
  const positive = String(pnl || subtitle || '').startsWith('+');
  const label = title || `${action} $${token}`;

  return (
    <figure className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-white/10 bg-white/[.04] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-[11px] text-neutral-500">{time || meta}</p>
        </div>
        <span className={cn('text-sm font-semibold', positive ? 'text-emerald-400' : 'text-red-400')}>
          {pnl || subtitle}
        </span>
      </div>
    </figure>
  );
}

function EmptyBackground({ message }) {
  return (
    <div className="absolute inset-x-4 top-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-neutral-500">
      {message}
    </div>
  );
}

function SourceBackground({ source }) {
  if (!source.handle) {
    return <EmptyBackground message={source.description} />;
  }

  const items = getSourceItems(source);
  if (!items.length) {
    return <EmptyBackground message={source.description} />;
  }

  if (source.id === 'youtube') {
    return (
      <DiagonalGrid columns={4} rows={3}>
        {items.map((item, index) => (
          <ThumbnailCard key={`${item.id}-${index}`} item={item} youtube />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'twitch') {
    return (
      <DiagonalGrid>
        {items.map((item, index) => (
          <ThumbnailCard key={`${item.id}-${index}`} item={item} liveColor="#9146FF" />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'kick') {
    return (
      <DiagonalGrid>
        {items.map((item, index) => (
          <ThumbnailCard key={`${item.id}-${index}`} item={item} liveColor="#05c270" />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'tiktok') {
    return (
      <DiagonalGrid columns={4} duration="36s">
        {items.map((item, index) => (
          <PortraitCard key={`${item.id}-${index}`} item={item} />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'x') {
    return (
      <OppositeRows>
        {items.map((item, index) => (
          <TweetCard key={`${item.id}-${index}`} title={item.title} meta={item.meta} />
        ))}
      </OppositeRows>
    );
  }

  if (source.id === 'instagram') {
    return (
      <DiagonalGrid columns={4} duration="40s">
        {items.map((item, index) => (
          <ImageCard key={`${item.id}-${index}`} item={item} />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'reddit') {
    return (
      <DiagonalGrid>
        {items.map((item, index) => (
          <RedditCard key={`${item.id}-${index}`} title={item.title} subtitle={item.subtitle} meta={item.meta} />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'pumpfun') {
    return (
      <DiagonalGrid>
        {items.map((item, index) => (
          <StatCard key={`${item.id}-${index}`} title={item.title} subtitle={item.subtitle} meta={item.meta} />
        ))}
      </DiagonalGrid>
    );
  }

  if (source.id === 'fomo') {
    return (
      <div className="absolute top-2 right-2 h-[250px] w-full scale-90 [mask-image:linear-gradient(to_top,transparent_8%,#000_70%)] transition-all duration-300 ease-out group-hover:scale-95">
        <AnimatedList loop delay={1100} maxVisible={3}>
          {items.map((item, index) => (
            <TradeRow key={`${item.id}-${index}`} title={item.title} subtitle={item.subtitle} meta={item.meta} />
          ))}
        </AnimatedList>
      </div>
    );
  }

  return (
    <DiagonalGrid>
      {items.map((item, index) => (
        <ThumbnailCard key={`${item.id}-${index}`} item={item} />
      ))}
    </DiagonalGrid>
  );
}

export default function ProfileSources({ sources = [], loading = false, onOpen, connectedOnly = false }) {
  const visible = connectedOnly ? sources.filter(source => source.handle) : sources;
  const skeletonIds = connectedOnly ? Object.keys(SOURCE_LAYOUT).slice(0, 4) : Object.keys(SOURCE_LAYOUT);

  if (loading) {
    return (
      <BentoGrid>
        {skeletonIds.map(id => (
          <div
            key={id}
            className={cn(
              'col-span-3 h-[22rem] animate-pulse rounded-xl border border-white/10 bg-white/[.03]',
              SOURCE_LAYOUT[id]
            )}
          />
        ))}
      </BentoGrid>
    );
  }

  if (!visible.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-5 py-10 text-sm text-muted-foreground">
        {connectedOnly ? 'No connected socials on this profile yet.' : 'Add a handle above to fill the grid.'}
      </div>
    );
  }

  return (
    <BentoGrid>
      {visible.map(source => {
        const Icon = ICONS[source.id] || TwitchIcon;
        const connected = Boolean(source.handle);
        return (
          <BentoCard
            key={source.id}
            id={sourceAnchorId(source.id)}
            Icon={Icon}
            name={source.name}
            description={source.description}
            href={connected ? source.href : '#accounts'}
            cta={connected ? 'Open' : 'Add handle'}
            className={cn('scroll-mt-24', visible.length === 1 ? 'col-span-3' : SOURCE_LAYOUT[source.id])}
            background={<SourceBackground source={source} />}
            onActivate={
              connected
                ? () => onOpen?.(source)
                : () => {
                    window.location.hash = 'accounts';
                  }
            }
          />
        );
      })}
    </BentoGrid>
  );
}
