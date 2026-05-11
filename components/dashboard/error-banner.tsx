'use client'

type Props = {
  message: string
  onRetry: () => void
  /** id-attribute prefix so multiple banners on a page don't collide */
  idPrefix?: string
  /** Override the heading text. Defaults to "Couldn't load data". */
  title?: string
  /** Hide the "Sign in again" link if the page is public. */
  showSignIn?: boolean
}

export function DashboardErrorBanner({
  message,
  onRetry,
  idPrefix = 'dash',
  title = "Couldn't load data",
  showSignIn = true,
}: Props) {
  return (
    <div
      id={`${idPrefix}-error-banner`}
      className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-200"
    >
      <div className="font-semibold mb-1">{title}</div>
      <div className="mb-3">{message}</div>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded bg-red-800/60 hover:bg-red-700/60 text-white text-xs font-medium"
        >
          Retry
        </button>
        {showSignIn && (
          <a
            href="/auth/login"
            className="px-3 py-1.5 rounded bg-[#171717] border border-gray-700 hover:bg-gray-800 text-gray-200 text-xs font-medium"
          >
            Sign in again
          </a>
        )}
      </div>
    </div>
  )
}
