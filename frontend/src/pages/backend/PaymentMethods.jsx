import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const METHOD_META = {
  CASH: { icon: '💵', label: 'Cash', desc: 'Accept physical cash payments' },
  CARD: { icon: '💳', label: 'Card / Digital', desc: 'Accept debit, credit & contactless payments' },
  UPI: { icon: '📱', label: 'UPI', desc: 'Accept UPI payments via QR code or ID' },
};

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-orange-500' : 'bg-gray-700'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
    </button>
  );
}

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [forms, setForms] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.get('/payment-methods');
      setMethods(data);
      const f = {};
      data.forEach(m => { f[m.id] = { isEnabled: m.isEnabled, upiId: m.upiId || '' }; });
      setForms(f);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (method) => {
    setSaving(s => ({ ...s, [method.id]: true }));
    try {
      await api.put(`/payment-methods/${method.id}`, forms[method.id]);
      toast.success(`${METHOD_META[method.name]?.label} settings saved`);
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(s => ({ ...s, [method.id]: false })); }
  };

  const update = (id, key, val) => setForms(f => ({ ...f, [id]: { ...f[id], [key]: val } }));

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
        <p className="text-gray-400 mt-1">Configure accepted payment methods for your POS terminal</p>
      </div>

      <div className="grid gap-4">
        {methods.map(method => {
          const meta = METHOD_META[method.name] || {};
          const form = forms[method.id] || {};
          return (
            <div key={method.id} className={`bg-gray-900 border rounded-xl p-6 transition ${form.isEnabled ? 'border-orange-500/40' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl w-14 h-14 flex items-center justify-center bg-gray-800 rounded-xl">{meta.icon}</div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{meta.label}</h3>
                    <p className="text-gray-400 text-sm">{meta.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{form.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  <Toggle checked={form.isEnabled} onChange={() => update(method.id, 'isEnabled', !form.isEnabled)} />
                </div>
              </div>

              {method.name === 'UPI' && form.isEnabled && (
                <div className="border-t border-gray-800 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">UPI ID</label>
                    <input
                      value={form.upiId}
                      onChange={e => update(method.id, 'upiId', e.target.value)}
                      placeholder="yourname@ybl"
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Customers can use this ID to pay directly</p>
                  </div>
                  {form.upiId && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-white p-3 rounded-xl">
                        <QRCodeSVG value={`upi://pay?pa=${form.upiId}&pn=Cafe+POS`} size={120} />
                      </div>
                      <p className="text-xs text-gray-500">Live QR Preview</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleSave(method)}
                  disabled={saving[method.id]}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {saving[method.id] ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
