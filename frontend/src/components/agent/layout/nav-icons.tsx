import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { ChatCircleDotsIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleDots';
 import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { ListBulletsIcon } from '@phosphor-icons/react/dist/ssr/ListBullets';
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { StackIcon } from '@phosphor-icons/react/dist/ssr/Stack';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';

export const navIcons = {
  'chart-pie': ChartPieIcon,
  'chat-circle-dots': ChatCircleDotsIcon,
  'gear-six': GearSixIcon,
  'list-bullets': ListBulletsIcon,
  'plugs-connected': PlugsConnectedIcon,
  stack: StackIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
} as Record<string, Icon>;
