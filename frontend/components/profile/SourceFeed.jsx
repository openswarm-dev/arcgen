'use client';

import { motion } from 'motion/react';

import { cn } from '@/lib/utils';
import { BentoCard, BentoGrid } from '@/registry/magicui/bento-grid';
import { feedCardLayout } from './platforms';
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

function VideoBackground({ item, accent, liveColor, youtube }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: youtube
            ? '#0a0a0a'
            : `radial-gradient(circle at 28% 38%, ${accent}66, transparent 46%), linear-gradient(135deg, #0a0a0a, #171717)`
        }}
      >
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
        {item.live ? (
          <span
            className="absolute left-3 top-3 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: liveColor }}
          >
            LIVE
          </span>
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center">
          {youtube ? (
            <span className="flex h-11 w-16 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg">
              <PlayGlyph className="ml-0.5 h-4 w-4" />
            </span>
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm">
              <PlayGlyph className="ml-0.5 h-5 w-5" />
            </span>
          )}
        </span>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
    </div>
  );
}

function TweetBackground({ item, handle }) {
  return (
    <div className="absolute inset-x-4 top-4 overflow-hidden rounded-xl border border-white/10 bg-white/[.04] p-4 transition-all duration-300 ease-out group-hover:scale-[1.03]">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-white">@{handle}</span>
        {item.meta ? <span className="text-neutral-500">{item.meta}</span> : null}
      </div>
      <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-[15px] leading-6 text-neutral-100">{item.title}</p>
    </div>
  );
}

function RedditBackground({ item }) {
  return (
    <div className="absolute inset-x-4 top-4 overflow-hidden rounded-xl border border-orange-500/20 bg-[#0f0f10] p-4 transition-all duration-300 ease-out group-hover:scale-[1.03]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-orange-400">{item.subtitle}</p>
      <h3 className="mt-2 line-clamp-4 text-base font-semibold text-white">{item.title}</h3>
      {item.meta ? <p className="mt-3 text-xs text-neutral-500">{item.meta}</p> : null}
    </div>
  );
}

function InstagramBackground({ item }) {
  return (
    <div className="absolute inset-3 overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 ease-out group-hover:scale-[1.03]">
      {item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-yellow-500 via-pink-500 to-purple-700 text-xs text-white">
          {item.title}
        </div>
      )}
    </div>
  );
}

function TikTokBackground({ item }) {
  return (
    <div className="absolute inset-x-0 top-3 flex justify-center [mask-image:linear-gradient(to_top,transparent_8%,#000_55%)]">
      <div className="relative h-[280px] w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 transition-all duration-300 ease-out group-hover:scale-105">
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-3">
          <p className="text-xs font-medium text-white">{item.title}</p>
          {item.subtitle ? <p className="mt-1 line-clamp-2 text-[11px] text-white/70">{item.subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

function PumpBackground({ item }) {
  return (
    <div className="absolute inset-x-4 top-4 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all duration-300 ease-out group-hover:scale-[1.03]">
      <p className="text-lg font-semibold text-white">{item.title}</p>
      {item.subtitle ? <p className="mt-1 text-sm text-neutral-400">{item.subtitle}</p> : null}
      {item.meta ? <p className="mt-6 text-sm text-emerald-400">{item.meta}</p> : null}
    </div>
  );
}

function FomoBackground({ item }) {
  const positive = String(item.subtitle || '').startsWith('+');
  return (
    <div className="absolute inset-x-4 top-4 overflow-hidden rounded-xl border border-white/10 bg-white/[.03] p-4 transition-all duration-300 ease-out group-hover:scale-[1.03]">
      <p className="text-sm font-medium text-white">{item.title}</p>
      <p className="mt-1 text-xs text-neutral-500">{item.meta}</p>
      <span className={cn('mt-6 inline-block text-lg font-semibold', positive ? 'text-emerald-400' : 'text-red-400')}>
        {item.subtitle}
      </span>
    </div>
  );
}

function ItemBackground({ source, item }) {
  if (source.id === 'youtube') {
    return <VideoBackground item={item} accent="#FF0000" liveColor="#FF0000" youtube />;
  }
  if (source.id === 'twitch') {
    return <VideoBackground item={item} accent="#9146FF" liveColor="#9146FF" />;
  }
  if (source.id === 'kick') {
    return <VideoBackground item={item} accent="#53FC18" liveColor="#05c270" />;
  }
  if (source.id === 'x') {
    return <TweetBackground item={item} handle={source.handle} />;
  }
  if (source.id === 'reddit') {
    return <RedditBackground item={item} />;
  }
  if (source.id === 'instagram') {
    return <InstagramBackground item={item} />;
  }
  if (source.id === 'tiktok') {
    return <TikTokBackground item={item} />;
  }
  if (source.id === 'pumpfun') {
    return <PumpBackground item={item} />;
  }
  if (source.id === 'fomo') {
    return <FomoBackground item={item} />;
  }
  return <VideoBackground item={item} accent="#888" liveColor="#888" />;
}

function cardCopy(source, item) {
  if (source.id === 'x') {
    return { name: `@${source.handle}`, description: item.meta || 'Post' };
  }
  if (source.id === 'instagram') {
    return { name: item.title, description: item.meta || 'Post' };
  }
  if (source.id === 'fomo') {
    return { name: item.title, description: item.meta || 'Trade' };
  }
  return {
    name: item.title,
    description: item.meta || item.subtitle || source.name,
  };
}

export default function SourceFeed({ source, onBack }) {
  const Icon = ICONS[source.id] || YouTubeIcon;
  const items = getSourceItems(source);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-card"
          >
            Back
          </button>
          <div className="flex items-center gap-2 text-foreground">
            <Icon className="h-5 w-5" />
            <h2 className="text-lg font-semibold tracking-tight">{source.name}</h2>
            {source.handle ? <span className="text-sm text-muted-foreground">@{source.handle}</span> : null}
          </div>
        </div>
        {source.href ? (
          <a
            href={source.href}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Open {source.name}
          </a>
        ) : null}
      </div>

      {items.length ? (
        <BentoGrid>
          {items.map((item, index) => {
            const copy = cardCopy(source, item);
            return (
              <motion.div
                key={item.id}
                className={cn('h-full', feedCardLayout(source.id, index, items.length))}
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30, delay: 0.08 + index * 0.05 }}
              >
                <BentoCard
                  className="h-full min-h-[22rem]"
                  Icon={Icon}
                  name={copy.name}
                  description={copy.description}
                  href={item.href || source.href}
                  target="_blank"
                  rel="noreferrer"
                  cta="Open"
                  background={<ItemBackground source={source} item={item} />}
                  onActivate={
                    item.href || source.href
                      ? () => window.open(item.href || source.href, '_blank', 'noopener,noreferrer')
                      : undefined
                  }
                />
              </motion.div>
            );
          })}
        </BentoGrid>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-5 py-10 text-sm text-muted-foreground">
          No public cards yet for this account. You can still open {source.name} directly.
        </div>
      )}
    </div>
  );
}
