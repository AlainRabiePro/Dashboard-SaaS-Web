import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Logs du Site',
  description: 'Affiche les logs en temps réel du site',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
