import { cn } from '../lib/utils';
import { useSidebar } from '../hooks/useSidebar';
import { buttonVariants } from './ui/button';
import { useLocation, Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './subnav-accordian';
import { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { type LucideIcon } from 'lucide-react';
import { useUser } from '../store/hooks/useUser';
import { getBackendUrl } from '../config';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  color?: string;
  isChildren?: boolean;
  children?: NavItem[];
}

interface SideNavProps {
  items: NavItem[];
  setOpen?: (open: boolean) => void;
  className?: string;
}

export function SideNav({ items, setOpen, className }: SideNavProps) {
  const user = useUser();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [openItem, setOpenItem] = useState('');
  const [lastOpenItem, setLastOpenItem] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOpenItem(lastOpenItem);
    } else {
      setLastOpenItem(openItem);
      setOpenItem('');
    }
  }, [isOpen]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem('chess_jwt_token');
      localStorage.removeItem('chess_user');
      await fetch(`${getBackendUrl()}/auth/logout`, { credentials: 'include' });
    } catch (e) {}
    window.location.href = '/';
  };

  return (
    <nav className="space-y-1 px-2">
      {items.map((item) => {
        if (user && item.title === 'Login') return null;
        if (!user && item.title === 'Logout') return null;

        if (item.isChildren) {
          return (
            <Accordion
              type="single"
              collapsible
              className="space-y-1"
              key={item.title}
              value={openItem}
              onValueChange={setOpenItem}
            >
              <AccordionItem value={item.title} className="border-none">
                <AccordionTrigger
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'group relative flex h-11 justify-between px-3 py-2 text-sm duration-200 hover:bg-stone-800/80 rounded-lg hover:no-underline text-textMain',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn('h-5 w-5', item.color)} />
                    <span className={cn('text-sm font-medium', !isOpen && className)}>
                      {item.title}
                    </span>
                  </div>
                  {isOpen && (
                    <ChevronDownIcon className="h-4 w-4 shrink-0 text-textSecondary transition-transform duration-200" />
                  )}
                </AccordionTrigger>
                <AccordionContent className="mt-1 space-y-1 pl-4">
                  {item.children?.map((child) => (
                    <Link
                      key={child.title}
                      to={child.href}
                      onClick={() => {
                        if (setOpen) setOpen(false);
                      }}
                      className={cn(
                        buttonVariants({ variant: 'ghost' }),
                        'group relative flex h-10 justify-start gap-x-3 px-3 rounded-lg text-sm text-textSecondary hover:text-white hover:bg-stone-800/60',
                        location.pathname === child.href &&
                          'bg-stone-800 text-white font-bold',
                      )}
                    >
                      <child.icon className={cn('h-4 w-4', child.color)} />
                      <span>{child.title}</span>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }

        const isLogout = item.title === 'Logout';

        return (
          <div key={item.title}>
            {isLogout ? (
              <a
                href={item.href}
                onClick={handleLogout}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'group relative flex h-11 w-full justify-start items-center gap-3 px-3 rounded-lg text-textMain hover:bg-red-500/10 hover:text-red-400 transition-colors',
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', item.color)} />
                <span className="text-sm font-medium">{item.title}</span>
              </a>
            ) : (
              <Link
                to={item.href}
                onClick={() => {
                  if (setOpen) setOpen(false);
                }}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'group relative flex h-11 w-full justify-start items-center gap-3 px-3 rounded-lg text-textMain hover:bg-stone-800/80 transition-colors',
                  location.pathname === item.href &&
                    'bg-stone-800/90 text-green-400 font-bold border-l-2 border-green-500',
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', item.color)} />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
