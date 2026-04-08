import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


function CustomAlert({
  openAlertDialog,
  setOpenAlertDialog,
  title,
  description,
  closeBtnTxt,
  okBtnTxt,
  action,
}:any) {
  return (
    <AlertDialog open={openAlertDialog} onOpenChange={setOpenAlertDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenAlertDialog(false)}>
            {closeBtnTxt}
          </AlertDialogCancel>
          <AlertDialogAction onClick={action}>{okBtnTxt}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CustomAlert;
