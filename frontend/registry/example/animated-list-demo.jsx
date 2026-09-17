'use client';

import { cn } from '@/lib/utils';
import { AnimatedList } from '@/registry/magicui/animated-list';

const notifications = [
  {
    name: 'Payment received',
    description: 'Magic UI',
    time: '15m ago',
    icon: '💸',
    color: '#00C9A7',
  },
  {
    name: 'User signed up',
    description: 'Magic UI',
    time: '10m ago',
    icon: '👤',
    color: '#FFB800',
  },
  {
    name: 'New message',
    description: 'Magic UI',
    time: '5m ago',
    icon: '💬',
    color: '#FF3D71',
  },
  {
    name: 'New event',
    description: 'Magic UI',
    time: '2m ago',
    icon: '🗞️',
    color: '#1E86FF',
  },
];

const loopNotifications = Array.from({ length: 8 }, () => notifications).flat();

function Notification({ name, description, icon, color, time }) {
  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[480px] cursor-pointer overflow-hidden rounded-2xl p-5',
        'transition-all duration-200 ease-in-out hover:scale-[103%]',
        'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]'
      )}
    >
      <div className="flex flex-row items-center gap-4">
        <div
          className="flex size-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-base sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-sm text-gray-500">{time}</span>
          </figcaption>
          <p className="text-base font-normal dark:text-white/60">{description}</p>
        </div>
      </div>
    </figure>
  );
}

export default function AnimatedListDemo({ className }) {
  return (
    <div
      className={cn(
        'relative flex h-[500px] w-full flex-col overflow-hidden p-2',
        className
      )}
    >
      <AnimatedList loop delay={900} maxVisible={4}>
        {loopNotifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
