import { Bell, Calendar, Home, User } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';

const navigationItems = [
  {
    title: 'Início',
    href: '/professionals',
    icon: Home,
  },
  {
    title: 'Agenda',
    href: '/professionals/schedule',
    icon: Calendar,
  },
  {
    title: 'Convites',
    href: '/professionals/invites',
    icon: Bell,
  },
  {
    title: 'Perfil',
    href: '/professionals/profile',
    icon: User,
  },
];

export default function ProfessionalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar items={navigationItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 