import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Check, X, Clock, User, Mail, Briefcase } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { PendingManagerRequest } from '@/hooks/usePendingManagerRequests';

interface PendingManagerRequestsDialogProps {
  open: boolean;
  onClose: () => void;
  requests: PendingManagerRequest[];
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
}

export function PendingManagerRequestsDialog({
  open,
  onClose,
  requests,
  onApprove,
  onReject,
}: PendingManagerRequestsDialogProps) {
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Permintaan Pendaftaran Manager
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Tidak ada permintaan pending</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{request.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{request.email}</span>
                      </div>
                      {request.jabatan && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          <span>{request.jabatan}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">
                      Pending
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Diajukan: {format(new Date(request.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="flex-1">
                          <Check className="mr-1 h-4 w-4" />
                          Setujui
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Setujui Permintaan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {request.name} akan didaftarkan sebagai Manager dan dapat mengakses semua fitur manager.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onApprove(request.id)}>
                            Setujui
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex-1">
                          <X className="mr-1 h-4 w-4" />
                          Tolak
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tolak Permintaan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permintaan dari {request.name} akan ditolak. Mereka akan menerima notifikasi tentang penolakan ini.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onReject(request.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Tolak
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
