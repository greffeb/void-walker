import { t } from '../i18n';

export function App(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-void-black)]">
      <h1 className="mb-4 text-4xl font-bold tracking-wider text-white">
        VOID WALKER
      </h1>
      <p className="text-lg text-gray-400">
        {t('ui.play')}
      </p>
    </div>
  );
}
