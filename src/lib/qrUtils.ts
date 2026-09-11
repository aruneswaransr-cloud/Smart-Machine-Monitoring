import QRCode from 'qrcode';

export async function generateQRDataURL(text: string, size = 256): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    color: {
      dark: '#0a0e14',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

export async function generateQRSVG(text: string, size = 256): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    width: size,
    margin: 2,
    color: {
      dark: '#0a0e14',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

export function downloadQRCode(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printQRCode(dataUrl: string, machineName: string): void {
  const win = window.open('', '_blank', 'width=400,height=500');
  if (!win) return;
  win.document.write(`
    <html>
    <head>
      <title>QR Code - ${machineName}</title>
      <style>
        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
        h1 { font-size: 18px; margin-bottom: 10px; }
        img { width: 256px; height: 256px; }
        p { font-size: 12px; color: #666; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>${machineName}</h1>
      <img src="${dataUrl}" />
      <p>Scan to view machine status</p>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export async function shareQRCode(dataUrl: string, machineName: string): Promise<void> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${machineName}-qr.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `QR Code - ${machineName}`,
        text: `Scan to view ${machineName} status`,
        files: [file],
      });
    } else {
      downloadQRCode(dataUrl, `${machineName}-qr.png`);
    }
  } catch {
    downloadQRCode(dataUrl, `${machineName}-qr.png`);
  }
}

export function getMachineStatusUrl(qrToken: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/m/${qrToken}`;
}
