export function LogoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M10.059 2.593c1.175-.784 2.707-.784 3.882 0l6.5 4.333C21.415 7.575 22 8.668 22 9.838V18.5c0 1.933-1.567 3.5-3.5 3.5h-4.25v-5.25c0-1.243-1.007-2.25-2.25-2.25s-2.25 1.007-2.25 2.25V22H5.5C3.567 22 2 20.433 2 18.5V9.838c0-1.17.585-2.263 1.559-2.912l6.5-4.333z" />
    </svg>
  );
}

export function ProfileIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M12 3.5a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zM4.75 19.15C5.2 16.18 8.2 14 12 14s6.8 2.18 7.25 5.15c.07.48.12.9.12 1.35H4.63c0-.45.05-.87.12-1.35z" />
    </svg>
  );
}

export function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" />
    </svg>
  );
}

export function ExploreIcon({ className }) {
  return <SearchIcon className={className} />;
}

export function PaymentsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path
        clipRule="evenodd"
        d="M16.161 3.55h4.117l-1.924 6.416c1.283 1.091 2.098 2.717 2.098 4.534 0 3.286-2.664 5.95-5.95 5.95h-.22l-.5 2.5h-6.44l.5-2.5H3.227l2.033-6.781C4.204 12.595 3.552 11.124 3.552 9.5c0-3.286 2.664-5.95 5.95-5.95h.22l.5-2.5h6.44z"
      />
    </svg>
  );
}

export function ComponentsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
    </svg>
  );
}

export function AnalyticsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M6 3h12c1.657 0 3 1.343 3 3v12c0 1.657-1.343 3-3 3H6c-1.657 0-3-1.343-3-3V6c0-1.657 1.343-3 3-3zM6 5h12c.552 0 1 .448 1 1v12c0 .552-.448 1-1 1H6c-.552 0-1-.448-1-1V6c0-.552.448-1 1-1z"
      />
      <path d="M7 13h2.2v4.2H7zM10.9 9.4h2.2v7.8h-2.2zM14.8 11.4h2.2v5.8h-2.2z" />
    </svg>
  );
}

export function LaunchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.002 5.611c0 2.689-1.085 5.259-3 7.137v4.01c0 1.06-.422 2.078-1.172 2.828l-4.265 4.266-1.937-5.812-4.667-4.667-5.81-1.935 4.265-4.266C5.166 6.422 6.183 6 7.244 6h4.01c1.878-1.915 4.448-3 7.137-3h2.611v2.611z"
      />
    </svg>
  );
}

export function CapitalFlowIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" className={className}>
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M13.5 3h-3C9.408 5.913 8.024 6.711 4.956 6.201l-1.5 2.598c1.976 2.402 1.976 4 0 6.402l1.5 2.598c3.068-.51 4.452.288 5.544 3.201h3c1.092-2.913 2.476-3.711 5.544-3.2l1.5-2.599c-1.976-2.402-1.976-4 0-6.402l-1.5-2.598c-3.068.51-4.452-.288-5.544-3.201Z"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function DocsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.067 12.701c1.169-1.168 3.063-1.168 4.232 0 1.168 1.169 1.168 3.063 0 4.232L17.83 21.4c-.827.827-1.918 1.339-3.083 1.445l-2.851.259.258-2.852c.106-1.165.618-2.256 1.445-3.083l4.468-4.469z"
      />
      <path d="M16 2c.684 0 1.257-.001 1.724.037.478.04.933.125 1.365.345.658.335 1.194.87 1.53 1.53.22.43.305.886.344 1.364C21 5.743 21 6.316 21 7v2h-2V7c0-.717 0-1.194-.03-1.56-.03-.355-.08-.518-.133-.62-.144-.283-.374-.513-.656-.657-.103-.052-.266-.104-.62-.133C17.194 4 16.716 4 16 4H8c-.717 0-1.194 0-1.56.03-.355.03-.518.08-.62.133-.283.144-.513.374-.657.656-.052.103-.104.266-.133.62C5 5.806 5 6.283 5 7v10c0 .716 0 1.194.03 1.56.03.355.08.518.133.62.144.283.374.513.656.657.103.052.266.104.62.133.367.03.844.03 1.561.03h1v2H8c-.684 0-1.257.001-1.724-.037-.478-.04-.933-.125-1.365-.345-.658-.335-1.194-.87-1.53-1.53-.22-.43-.305-.886-.344-1.364C3 18.257 3 17.684 3 17V7c0-.684-.001-1.257.037-1.724.04-.478.125-.933.345-1.365.335-.658.87-1.194 1.53-1.53.43-.22.886-.305 1.364-.344C6.743 2 7.316 2 8 2h8z" />
      <path d="M13 13H8v-2h5v2zm3-4H8V7h8v2z" />
    </svg>
  );
}

export function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M3.5 7.5h17" />
      <path d="M3.5 16.5h17" />
    </svg>
  );
}

export function CollapseIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
      />
    </svg>
  );
}
