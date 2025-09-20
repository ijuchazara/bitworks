import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'home', title: 'Home', href: paths.agent.overview, icon: 'chart-pie' },
  { key: 'settings', title: 'Settings', href: paths.agent.settings, icon: 'gear-six' },
  { key: 'templates', title: 'Templates', href: paths.agent.templates, icon: 'stack' },
  { key: 'clients', title: 'Clients', href: paths.agent.clients, icon: 'users' },
  { key: 'attributes', title: 'Attributes', href: paths.agent.attributes, icon: 'list-bullets' },
  { key: 'users', title: 'Users', href: paths.agent.users, icon: 'user' },
  { key: 'chat', title: 'Conversation', href: paths.agent.chat, icon: 'chat-circle-dots' },
] satisfies NavItemConfig[];
