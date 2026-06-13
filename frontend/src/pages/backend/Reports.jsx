import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const fmt = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ru  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatCard = ({ label, value, icon, iconBg, sub }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl shrink-0 ${iconBg}`}>{icon}</div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-white mt-0.5 truncate">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-orange-400 font-semibold">{fmt(payload[0]?.value)}</p>
      {payload[1] && <p className="text-blue-400">{payload[1].value} orders</p>}
    </div>
  );
};

function buildPrintHTML(data, period) {
  const prodRows = (data.topProducts || [])
    .map((p, i) => `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.qty}</td><td>Rs.${ru(p.revenue)}</td></tr>`)
    .join('') || '<tr><td colspan="4" class="e">No data</td></tr>';
  const ordRows = (data.topOrders || [])
    .map(o => `<tr><td>${o.orderNumber}</td><td>Rs.${parseFloat(o.total).toFixed(2)}</td><td>${new Date(o.createdAt).toLocaleString('en-IN')}</td></tr>`)
    .join('') || '<tr><td colspan="3" class="e">No data</td></tr>';
  const catRows = (data.topCategories || [])
    .map(c => `<tr><td>${c.name}</td><td>Rs.${ru(c.revenue)}</td></tr>`)
    .join('') || '<tr><td colspan="2" class="e">No data</td></tr>';

  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cafe POS Report</title>',
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:Segoe UI,Arial,sans-serif;color:#111;background:#fff;padding:28px;font-size:13px}',
    'h1{font-size:20px;font-weight:800;color:#ea580c;margin-bottom:2px}',
    '.meta{font-size:11px;color:#888;margin-bottom:20px}',
    '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}',
    '.stat{border:1px solid #e5e7eb;border-radius:8px;padding:12px}',
    '.sl{font-size:9px;text-transform:uppercase;color:#9ca3af;letter-spacing:.05em}',
    '.sv{font-size:17px;font-weight:700;margin-top:3px}',
    '.ss{font-size:10px;color:#9ca3af;margin-top:1px}',
    '.row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}',
    '.box{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}',
    '.bt{padding:8px 12px;background:#f9fafb;font-size:11px;font-weight:700;border-bottom:1px solid #e5e7eb;color:#374151}',
    'table{width:100%;border-collapse:collapse;font-size:11px}',
    'th{background:#f9fafb;text-align:left;padding:6px 10px;font-size:9px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb}',
    'td{padding:6px 10px;border-bottom:1px solid #f3f4f6}',
    'tr:last-child td{border-bottom:none}',
    '.e{text-align:center;color:#9ca3af;padding:12px}',
    'footer{margin-top:24px;font-size:9px;color:#9ca3af;text-align:center;border-top:1px solid #f3f4f6;padding-top:10px}',
    '@media print{body{padding:14px}}',
    '</style></head><body>',
    '<h1>Cafe POS - Sales Report</h1>',
    `<div class="meta">Period: <b>${period}</b> &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')}</div>`,
    '<div class="stats">',
    `<div class="stat"><div class="sl">Total Orders</div><div class="sv">${data.totalOrders}</div><div class="ss">Period: ${period}</div></div>`,
    `<div class="stat"><div class="sl">Total Revenue</div><div class="sv">Rs.${ru(data.revenue)}</div><div class="ss">Paid orders only</div></div>`,
    `<div class="stat"><div class="sl">Avg Order Value</div><div class="sv">Rs.${ru(data.avgOrderValue)}</div></div>`,
    `<div class="stat"><div class="sl">Top Product</div><div class="sv" style="font-size:13px">${data.topProducts?.[0]?.name||'-'}</div><div class="ss">${data.topProducts?.[0]?data.topProducts[0].qty+' sold':''}</div></div>`,
    '</div>',
    '<div class="row">',
    '<div class="box"><div class="bt">Top Products</div>',
    `<table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead><tbody>${prodRows}</tbody></table></div>`,
    '<div class="box"><div class="bt">Highest Orders</div>',
    `<table><thead><tr><th>Order #</th><th>Amount</th><th>Time</th></tr></thead><tbody>${ordRows}</tbody></table></div>`,
    '<div class="box"><div class="bt">Sales by Category</div>',
    `<table><thead><tr><th>Category</th><th>Revenue</th></tr></thead><tbody>${catRows}</tbody></table></div>`,
    '</div>',
    `<footer>Cafe POS &mdash; Confidential &mdash; ${new Date().toLocaleDateString('en-IN')}</footer>`,
    '</body></html>',
  ].join('');
}

export default function Reports() {
  const [period, setPeriod]         = useState('today');
  const [employeeId, setEmployeeId] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [employees, setEmployees]   = useState([]);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    api.get('/users').then(setEmployees).catch(() => {});
    fetchReport();
    // eslint-disable-next-line
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (employeeId) params.set('employeeId', employeeId);
      const res = await api.get(`/reports/dashboard?${params}`);
      setData(res);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  }, [period, employeeId]);

  /* ── PDF: hidden iframe approach (no popup blocker) ──── */
  const handleExportPDF = () => {
    if (!data) return toast.error('No report data to export');
    const old = document.getElementById('__print_frame__');
    if (old) old.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '__print_frame__';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(buildPrintHTML(data, period));
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => iframe.remove(), 2000);
      }, 300);
    };
    setTimeout(() => {
      if (!iframe.isConnected) return;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 800);

    toast.success('Print dialog opening…');
  };

  /* ── CSV: axios (auto token) + responseType blob ────── */
  const handleExportXLS = async () => {
    try {
      const params = new URLSearchParams({ period });
      if (employeeId) params.set('employeeId', employeeId);

      // axios interceptor automatically adds Bearer token
      // responseType: 'blob' makes axios return the raw binary data
      const blob = await api.get(`/reports/export-csv?${params}`, {
        responseType: 'blob',
      });

      const filename = `cafe-pos-${period}-${new Date().toISOString().slice(0,10)}.csv`;
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href      = url;
      link.download  = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 3000);

      toast.success('CSV downloaded!');
    } catch (e) {
      console.error('CSV export error:', e);
      toast.error('Export failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const topProduct = data?.topProducts?.[0]?.name || '—';

  return (
    <div>
      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        {period === 'custom' && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Employee</label>
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <button onClick={fetchReport} disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
        <div className="flex gap-2 ml-auto">
          <button onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
            🖨️ Export PDF
          </button>
          <button onClick={handleExportXLS}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
            📊 Export CSV/XLS
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading report…</div>
      )}

      {data && (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Orders"    value={data.totalOrders}        icon="📋" iconBg="bg-blue-500/20"   sub={`Period: ${period}`} />
            <StatCard label="Total Revenue"   value={fmt(data.revenue)}       icon="💰" iconBg="bg-green-500/20"  sub="Paid orders only" />
            <StatCard label="Avg Order Value" value={fmt(data.avgOrderValue)} icon="📊" iconBg="bg-orange-500/20" />
            <StatCard label="Top Product"     value={topProduct}              icon="🏆" iconBg="bg-purple-500/20" sub={data.topProducts?.[0] ? `${data.topProducts[0].qty} sold` : ''} />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">
                Revenue Trend <span className="text-gray-500 text-xs font-normal ml-2">Last 7 days</span>
              </h2>
              {data.trendData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.trendData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fill:'#9CA3AF', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#9CA3AF', fontSize:11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `\u20b9${v}`} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} dot={{ fill:'#F97316', r:4 }} activeDot={{ r:6 }} />
                    <Line type="monotone" dataKey="orders"  stroke="#3B82F6" strokeWidth={1.5} dot={{ fill:'#3B82F6', r:3 }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600">No trend data</div>
              )}
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-orange-500 inline-block rounded" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block rounded" /> Orders</span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Sales by Category</h2>
              {data.topCategories?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.topCategories} dataKey="revenue" nameKey="name"
                        cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={3} stroke="none">
                        {data.topCategories.map((c, i) => (
                          <Cell key={i} fill={c.color || `hsl(${i*60},65%,55%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#1F2937', border:'1px solid #374151', borderRadius:8, color:'#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {data.topCategories.slice(0,5).map((c,i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color || `hsl(${i*60},65%,55%)` }} />
                          <span className="text-gray-300">{c.name}</span>
                        </span>
                        <span className="text-gray-400 font-mono">{fmt(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600">No category data</div>
              )}
            </div>
          </div>

          {/* ── Tables ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">🏅 Top Products</h3>
              </div>
              <table className="w-full">
                <thead><tr className="text-xs text-gray-600 uppercase border-b border-gray-800">
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr></thead>
                <tbody>
                  {(data.topProducts||[]).map((p,i) => (
                    <tr key={i} className={`text-sm ${i%2===0?'bg-gray-900':'bg-gray-800/40'}`}>
                      <td className="px-4 py-2.5 text-gray-500 font-mono">{i+1}</td>
                      <td className="px-4 py-2.5 text-gray-200">{p.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{p.qty}</td>
                      <td className="px-4 py-2.5 text-right text-orange-400 font-medium">{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                  {!data.topProducts?.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-600 text-xs">No data</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">💳 Highest Orders</h3>
              </div>
              <table className="w-full">
                <thead><tr className="text-xs text-gray-600 uppercase border-b border-gray-800">
                  <th className="px-4 py-2 text-left">Order #</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Time</th>
                </tr></thead>
                <tbody>
                  {(data.topOrders||[]).map((o,i) => (
                    <tr key={o.id} className={`text-sm ${i%2===0?'bg-gray-900':'bg-gray-800/40'}`}>
                      <td className="px-4 py-2.5 text-blue-400 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-2.5 text-right text-white font-semibold">{fmt(o.total)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 text-xs">
                        {new Date(o.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                  {!data.topOrders?.length && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-600 text-xs">No data</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">🏷️ Sales by Category</h3>
              </div>
              <table className="w-full">
                <thead><tr className="text-xs text-gray-600 uppercase border-b border-gray-800">
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr></thead>
                <tbody>
                  {(data.topCategories||[]).map((c,i) => (
                    <tr key={i} className={`text-sm ${i%2===0?'bg-gray-900':'bg-gray-800/40'}`}>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor:(c.color||'#6B7280')+'33', border:`1px solid ${c.color||'#6B7280'}55` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color||'#6B7280' }} />
                          {c.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-400 font-medium">{fmt(c.revenue)}</td>
                    </tr>
                  ))}
                  {!data.topCategories?.length && <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-600 text-xs">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
