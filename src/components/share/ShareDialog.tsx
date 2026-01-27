'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Share2, Mail, MessageCircle, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeStyling from 'qr-code-styling';
import { useEffect, useRef } from 'react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
}

export function ShareDialog({ open, onOpenChange, formId, formTitle }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  const formUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${formId}/submit`;

  // Generate QR Code
  useEffect(() => {
    if (open && qrCodeRef.current && !qrCodeInstance.current) {
      qrCodeInstance.current = new QRCodeStyling({
        width: 300,
        height: 300,
        data: formUrl,
        margin: 10,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'Q',
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 0,
        },
        dotsOptions: {
          type: 'rounded',
          color: '#1e293b',
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#1e293b',
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#1e293b',
        },
      });

      qrCodeInstance.current.append(qrCodeRef.current);
    }
  }, [open, formUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Fill out this form: ${formTitle}\n${formUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Fill out: ${formTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease fill out this form:\n\n${formTitle}\n${formUrl}\n\nThank you!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadQRCode = () => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({
        name: `form-${formId}-qr`,
        extension: 'png',
      });
      toast.success('QR code downloaded!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Form
          </DialogTitle>
          <DialogDescription>
            Share this form with respondents using a link, QR code, or social media
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="form-url">Form URL</Label>
              <div className="flex gap-2">
                <Input
                  id="form-url"
                  value={formUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Anyone with this link can fill out the form
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Form ID</h4>
              <p className="font-mono text-sm text-blue-700">{formId}</p>
              <p className="text-xs text-blue-600 mt-2">
                Share this ID for respondents to find your form
              </p>
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div
                ref={qrCodeRef}
                className="bg-white p-4 rounded-lg border-2 border-slate-200"
              />
              <Button onClick={downloadQRCode} variant="outline" className="w-full max-w-xs">
                <QrCode className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
              <p className="text-xs text-slate-500 text-center max-w-md">
                Print this QR code on flyers, posters, or display it anywhere.
                Respondents can scan it to access the form instantly.
              </p>
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <MessageCircle className="mr-3 h-5 w-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Share via WhatsApp</div>
                  <div className="text-xs text-slate-500">Send to contacts or groups</div>
                </div>
              </Button>

              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Mail className="mr-3 h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Share via Email</div>
                  <div className="text-xs text-slate-500">Send invitation emails</div>
                </div>
              </Button>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-medium text-sm mb-2">More Sharing Options</h4>
                <p className="text-xs text-slate-600 mb-3">
                  Copy the link above and share it on:
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-white rounded border">Facebook</span>
                  <span className="px-2 py-1 bg-white rounded border">Twitter</span>
                  <span className="px-2 py-1 bg-white rounded border">LinkedIn</span>
                  <span className="px-2 py-1 bg-white rounded border">Telegram</span>
                  <span className="px-2 py-1 bg-white rounded border">Instagram Bio</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
