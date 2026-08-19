import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
} from './ui/alert-dialog';

const ExitGameModel = ({ onClick }: { onClick: () => void }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="px-5 py-2.5 bg-red-600/90 hover:bg-red-600 transition-colors rounded-lg font-semibold text-white text-sm shadow-md flex items-center justify-center">
        Resign / Exit
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-bgAuxiliary border border-white/10 text-textMain shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-white">
            Are you sure you want to exit?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-textSecondary">
            This action cannot be undone and will count as a forfeit/loss for this match.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="bg-stone-700 text-white hover:bg-stone-600 border-none">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onClick}
            className="bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            Confirm Resign
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExitGameModel;
