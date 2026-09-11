import { useState, useEffect } from 'react';
import { QrCode, Download, Printer, Share2, Cpu, Search } from 'lucide-react';
import type { Machine } from '@/types';
import { generateQRDataURL, downloadQRCode, printQRCode, shareQRCode, getMachineStatusUrl } from '@/lib/qrUtils';

export interface QRManagementPageProps {
  machines: Machine[];
  onSelectMachine: (id: string) => void;
}

export function QRManagementPage({ machines, onSelectMachine }: QRManagementPageProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (machines.length > 0 && !selectedId) {
      setSelectedId(machines[0].id);
    }
  }, [machines, selectedId]);

  const selectedMachine = machines.find((m) => m.id === selectedId);

  useEffect(() => {
    if (selectedMachine) {
      const url = getMachineStatusUrl(selectedMachine.qr_token);
      generateQRDataURL(url, 320).then(setQrUrl);
    }
  }, [selectedMachine]);

  const filteredMachines = machines.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-text-main mb-1">QR Code Management</h1>
        <p className="text-sm text-text-dim mb-6">
          Generate, download, print, and share QR codes for each machine. Print and attach physically to the machine for quick scanning.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Machine list */}
          <div className="glass-panel rounded-2xl p-4 lg:col-span-1">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="text"
                placeholder="Search machines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredMachines.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left rounded-lg p-3 border transition-all ${
                    m.id === selectedId ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 ${m.id === selectedId ? 'text-primary' : 'text-text-dim'}`} />
                    <span className="text-sm font-semibold text-text-main">{m.name}</span>
                  </div>
                  <div className="text-xs text-text-dim ml-6">{m.type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* QR display */}
          <div className="lg:col-span-2">
            {selectedMachine && qrUrl ? (
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-2xl p-6 mb-4">
                    <img src={qrUrl} alt={`QR Code for ${selectedMachine.name}`} className="w-64 h-64" />
                  </div>
                  <h2 className="text-lg font-bold text-text-main mb-1">{selectedMachine.name}</h2>
                  <p className="text-sm text-text-dim mb-1">{selectedMachine.type} · {selectedMachine.location}</p>
                  <p className="text-xs text-text-dim font-mono mb-4 break-all text-center max-w-md">
                    {getMachineStatusUrl(selectedMachine.qr_token)}
                  </p>

                  {/* Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-md">
                    <button
                      onClick={() => downloadQRCode(qrUrl, `${selectedMachine.name}-qr.png`)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface-2 border border-border hover:border-primary/30 transition-all"
                    >
                      <Download className="w-5 h-5 text-primary" />
                      <span className="text-xs text-text-main">Download</span>
                    </button>
                    <button
                      onClick={() => printQRCode(qrUrl, selectedMachine.name)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface-2 border border-border hover:border-primary/30 transition-all"
                    >
                      <Printer className="w-5 h-5 text-primary" />
                      <span className="text-xs text-text-main">Print</span>
                    </button>
                    <button
                      onClick={() => shareQRCode(qrUrl, selectedMachine.name)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface-2 border border-border hover:border-primary/30 transition-all"
                    >
                      <Share2 className="w-5 h-5 text-primary" />
                      <span className="text-xs text-text-main">Share</span>
                    </button>
                    <button
                      onClick={() => onSelectMachine(selectedMachine.id)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface-2 border border-border hover:border-primary/30 transition-all"
                    >
                      <QrCode className="w-5 h-5 text-primary" />
                      <span className="text-xs text-text-main">View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <QrCode className="w-12 h-12 text-text-dim mx-auto mb-3 opacity-50" />
                <p className="text-text-dim text-sm">Select a machine to view its QR code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
