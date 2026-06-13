import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import toast from 'react-hot-toast';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function QRModal({ table, onClose }) {
  const menuUrl = `${window.location.origin}/menu?table=${encodeURIComponent(table.tableNumber)}`;

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=400,height=500');
    printWin.document.write(`
      <html>
        <head>
          <title>QR — Table ${table.tableNumber}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center;
                   justify-content: center; min-height: 100vh; font-family: sans-serif;
                   background: #fff; color: #111; }
            h2  { font-size: 22px; margin-bottom: 4px; }
            p   { color: #666; font-size: 13px; margin-bottom: 20px; }
            svg { display: block; }
            small { margin-top: 16px; font-size: 11px; color: #aaa; word-break: break-all; max-width: 300px; text-align: center; }
          </style>
        </head>
        <body>
          <h2>Table ${table.tableNumber}</h2>
          <p>Scan to view the menu</p>
          <div id="qr"></div>
          <small>${menuUrl}</small>
          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.createElement('canvas'), '${menuUrl}', { width: 260 }, function(err, canvas) {
              if (!err) document.getElementById('qr').appendChild(canvas);
              setTimeout(() => { window.print(); window.close(); }, 500);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">QR Code — Table {table.tableNumber}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {/* QR code on white background */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <QRCodeSVG
              value={menuUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#111111"
              level="M"
            />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Table {table.tableNumber}</p>
            <p className="text-gray-500 text-xs mt-1">Scan to view menu</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 break-all text-center max-w-full">
            {menuUrl}
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => { navigator.clipboard.writeText(menuUrl); toast.success('Link copied!'); }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              📋 Copy Link
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              🖨️ Print QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tables() {
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [modal, setModal] = useState(null);
  const [tableForm, setTableForm] = useState({ tableNumber: '', seats: 4, floorId: '' });
  const [floorName, setFloorName] = useState('');
  const [qrTable, setQrTable] = useState(null);

  const load = async () => {
    try {
      const [f, t] = await Promise.all([api.get('/floors'), api.get('/tables')]);
      setFloors(f); setTables(t);
      if (!selectedFloor && f.length > 0) setSelectedFloor(f[0].id);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredTables = tables.filter(t => t.floorId === selectedFloor);

  const addFloor = async (e) => {
    e.preventDefault();
    if (!floorName.trim()) return;
    try { await api.post('/floors', { name: floorName }); setFloorName(''); setModal(null); toast.success('Floor added'); load(); }
    catch { toast.error('Failed to add floor'); }
  };

  const deleteFloor = async (id) => {
    try { await api.delete(`/floors/${id}`); toast.success('Floor deleted'); setSelectedFloor(null); load(); }
    catch { toast.error('Failed'); }
  };

  const addTable = async (e) => {
    e.preventDefault();
    try { await api.post('/tables', { ...tableForm, floorId: selectedFloor }); setModal(null); toast.success('Table added'); load(); }
    catch { toast.error('Failed to add table'); }
  };

  const deleteTable = async (id) => {
    try { await api.delete(`/tables/${id}`); toast.success('Table removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Floor & Tables</h1>
        <button onClick={() => setModal('addFloor')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">+ Add Floor</button>
      </div>

      <div className="flex gap-6">
        {/* Floors Sidebar */}
        <div className="w-48 shrink-0">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-3 px-1">Floors</div>
          <div className="space-y-1">
            {floors.map(f => (
              <div key={f.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition ${selectedFloor === f.id ? 'bg-orange-500 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                onClick={() => setSelectedFloor(f.id)}>
                <span className="text-sm font-medium">{f.name}</span>
                <button onClick={e => { e.stopPropagation(); deleteFloor(f.id); }}
                  className="text-xs opacity-60 hover:opacity-100 hover:text-red-400">✕</button>
              </div>
            ))}
            {floors.length === 0 && <div className="text-gray-600 text-xs px-1">No floors yet</div>}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1">
          {selectedFloor ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400 text-sm">{filteredTables.length} tables on this floor</div>
                <button onClick={() => { setTableForm({ tableNumber: '', seats: 4, floorId: selectedFloor }); setModal('addTable'); }}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm transition">
                  + Add Table
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredTables.map(t => (
                  <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 relative group hover:border-gray-600 transition">
                    <button onClick={() => deleteTable(t.id)}
                      className="absolute top-2 right-2 text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                    <div className="text-2xl font-bold text-white mb-1">{t.tableNumber}</div>
                    <div className="text-xs text-gray-500">👤 {t.seats} seats</div>
                    <div className={`text-xs mt-2 ${t.currentOrderId ? 'text-yellow-400' : 'text-green-400'}`}>
                      {t.currentOrderId ? '● Occupied' : '● Available'}
                    </div>
                    {/* QR Button */}
                    <button
                      onClick={() => setQrTable(t)}
                      className="mt-3 w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <span>📱</span> View QR
                    </button>
                  </div>
                ))}
                {filteredTables.length === 0 && (
                  <div className="col-span-full bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500">
                    No tables on this floor. Add one!
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">Select a floor to view tables</div>
          )}
        </div>
      </div>

      {modal === 'addFloor' && (
        <Modal title="Add Floor" onClose={() => setModal(null)}>
          <form onSubmit={addFloor} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Floor Name *</label>
              <input required value={floorName} onChange={e => setFloorName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="e.g. Ground Floor" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Add Floor</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'addTable' && (
        <Modal title="Add Table" onClose={() => setModal(null)}>
          <form onSubmit={addTable} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Table Number *</label>
              <input required value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="e.g. T7" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Seats</label>
              <input type="number" min="1" value={tableForm.seats} onChange={e => setTableForm({ ...tableForm, seats: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Add Table</button>
            </div>
          </form>
        </Modal>
      )}

      {qrTable && <QRModal table={qrTable} onClose={() => setQrTable(null)} />}
    </div>
  );
}
