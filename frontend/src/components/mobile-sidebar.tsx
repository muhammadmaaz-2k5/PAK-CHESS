import { useState, useEffect } from 'react';
import { MenuIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { SideNav } from './side-nav';
import { UpperNavItems, LowerNavItems } from './constants/side-nav';
import { Link } from 'react-router-dom';

export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 text-textMain hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors">
          <MenuIcon size={22} />
          <span className="text-lg font-bold tracking-tight">Pak Chess</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 bg-bgAuxiliary text-textMain flex flex-col justify-between p-4 border-r border-white/10"
      >
        <div className="flex flex-col gap-6">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 mt-2">
            <img src="/chess.png" alt="Pak Chess Logo" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Pak <span className="text-green-500">Chess</span>
            </span>
          </Link>
          <SideNav items={UpperNavItems} setOpen={setOpen} />
        </div>
        <div className="flex flex-col justify-end mb-2">
          <SideNav items={LowerNavItems} setOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
