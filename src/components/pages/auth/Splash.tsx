import { Spinner } from '~components/atoms/Spinner';
import { cn } from '~lib/cn';

/** Full-screen centered spinner / message used during auth redirects. */
export function Splash({ title, error }: { title: string; error?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-app">
      {!error && <Spinner size={26} />}
      <div
        className={cn(
          'text-[14px]',
          error
            ? 'max-w-[360px] px-6 text-center text-danger-text-2'
            : 'text-muted',
        )}
      >
        {error ?? title}
      </div>
    </div>
  );
}
