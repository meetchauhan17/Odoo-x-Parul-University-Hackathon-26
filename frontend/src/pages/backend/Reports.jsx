import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  BarChart3, Clipboard, Coins, Trophy, CreditCard, Tag,
  Printer, FileSpreadsheet, FileText, AlertTriangle
} from 'lucide-react';

const fmt = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ru  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, sub }) => (
  <div className="bg-white border-2 border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-pop-sm">
    <div className={`w-12 h-12 flex items-center justify-center border-2 border-slate-800 rounded-xl shadow-pop-sm shrink-0 ${iconBg} ${iconColor}`}>
      {Icon && <Icon size={20} strokeWidth={2.5} />}
    </div>
    <div className="min-w-0">
      <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">{label}</div>
      <div className="text-xl font-black text-slate-800 mt-0.5 truncate font-outfit">{value}</div>
      {sub && <div className="text-xs text-slate-400 font-semibold mt-0.5">{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 border-slate-800 rounded-xl p-3 text-sm shadow-pop-sm text-slate-800">
      <p className="text-slate-400 mb-1 font-bold">{label}</p>
      <p className="text-[#8B5CF6] font-black">{fmt(payload[0]?.value)}</p>
      {payload[1] && <p className="text-blue-500 font-semibold">{payload[1].value} orders</p>}
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
      if (period === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      }
      if (employeeId) params.set('employeeId', employeeId);
      const res = await api.get(`/reports/dashboard?${params}`);
      setData(res);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  }, [period, employeeId, customFrom, customTo]);

  /* ── PDF: hidden iframe (no popup blocker) ──────────── */
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

  /* ── Build xlsx workbook from data ── */
  const buildWorkbook = () => {
    const f  = n => Number(n||0).toFixed(2);
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Cafe POS — Sales Report', '', `Period: ${period}`],
      ['Generated:', new Date().toLocaleString('en-IN')],
      [],
      ['Metric','Value'],
      ['Total Orders', data.totalOrders],
      ['Total Revenue (Rs.)', f(data.revenue)],
      ['Avg Order Value (Rs.)', f(data.avgOrderValue)],
      ['Top Product', data.topProducts?.[0]?.name||'-'],
    ]);
    ws1['!cols']=[{wch:26},{wch:22}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['#','Product','Qty Sold','Revenue (Rs.)'],
      ...(data.topProducts||[]).map((p,i)=>[i+1,p.name,p.qty,f(p.revenue)]),
    ]);
    ws2['!cols']=[{wch:4},{wch:28},{wch:10},{wch:16}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Top Products');
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Category','Revenue (Rs.)'],
      ...(data.topCategories||[]).map(c=>[c.name,f(c.revenue)]),
    ]);
    ws3['!cols']=[{wch:22},{wch:16}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Categories');
    const ws4 = XLSX.utils.aoa_to_sheet([
      ['Order #','Amount (Rs.)','Date & Time'],
      ...(data.topOrders||[]).map(o=>[o.orderNumber,f(o.total),new Date(o.createdAt).toLocaleString('en-IN')]),
    ]);
    ws4['!cols']=[{wch:20},{wch:16},{wch:24}];
    XLSX.utils.book_append_sheet(wb, ws4, 'Orders');
    return wb;
  };

  /* ── Build CSV string from data ── */
  const buildCSV = () => {
    const f = n => Number(n||0).toFixed(2);
    const q = v => `"${String(v??'').replace(/"/g,'""')}"`;
    return '\uFEFF' + [
      ['Cafe POS Report',`Period:${period}`,`Generated:${new Date().toLocaleString('en-IN')}`],
      [],['SUMMARY'],
      ['Total Orders',data.totalOrders],
      ['Total Revenue (Rs.)',f(data.revenue)],
      ['Avg Order Value (Rs.)',f(data.avgOrderValue)],
      [],['TOP PRODUCTS'],['#','Product','Qty Sold','Revenue (Rs.)'],
      ...(data.topProducts||[]).map((p,i)=>[i+1,p.name,p.qty,f(p.revenue)]),
      [],['TOP CATEGORIES'],['Category','Revenue (Rs.)'],
      ...(data.topCategories||[]).map(c=>[c.name,f(c.revenue)]),
      [],['TOP ORDERS'],['Order #','Amount (Rs.)','Date & Time'],
      ...(data.topOrders||[]).map(o=>[o.orderNumber,f(o.total),new Date(o.createdAt).toLocaleString('en-IN')]),
    ].map(r=>r.map(q).join(',')).join('\r\n');
  };

  /* ── Export XLS via native Save-As dialog ── */
  const handleExportXLS = async () => {
    if (!data) return toast.error('Load a report first');
    try {
      const wb  = buildWorkbook();
      const buf = XLSX.write(wb, { bookType:'xlsx', type:'array' });
      const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const name = `cafe-pos-${period}-${new Date().toISOString().slice(0,10)}.xlsx`;

      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{ description:'Excel Workbook', accept:{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success('Excel file saved!');
      } else {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href:url, download:name });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url), 10000);
        toast.success('Excel downloaded!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Export failed: ' + e.message);
    }
  };

  /* ── Export CSV via native Save-As dialog ── */
  const handleExportCSV = async () => {
    if (!data) return toast.error('Load a report first');
    try {
      const csv  = buildCSV();
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const name = `cafe-pos-${period}-${new Date().toISOString().slice(0,10)}.csv`;

      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{ description:'CSV File', accept:{ 'text/csv':['.csv'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success('CSV file saved!');
      } else {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href:url, download:name });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url), 10000);
        toast.success('CSV downloaded!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Export failed: ' + e.message);
    }
  };

  const topProduct = data?.topProducts?.[0]?.name || '—';

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={24} className="text-[#34D399]" />
        <h1 className="text-2xl font-black text-slate-800 font-outfit">Reports & Analytics</h1>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-end gap-4 mb-6 bg-white border-2 border-slate-800 rounded-2xl p-5 shadow-pop-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-0.5">Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#34D399] font-semibold transition">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        {period === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-0.5">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#34D399] font-semibold transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-0.5">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#34D399] font-semibold transition" />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-0.5">Employee</label>
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
            className="bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#34D399] font-semibold transition">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <button onClick={fetchReport} disabled={loading}
          className="bg-[#34D399] hover:bg-[#28b380] text-slate-900 border-2 border-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all disabled:opacity-50">
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
        <div className="flex gap-2 ml-auto">
          <button onClick={handleExportPDF}
            className="bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-2">
            <Printer size={15} /> Export PDF
          </button>
          <button onClick={handleExportXLS}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-2">
            <FileSpreadsheet size={15} /> Export XLS
          </button>
          <button onClick={handleExportCSV}
            className="bg-sky-500 hover:bg-sky-600 text-white border-2 border-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-2">
            <FileText size={15} /> Export CSV
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading report…</div>
      )}

      {data && (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Orders"    value={data.totalOrders}        icon={Clipboard} iconBg="bg-blue-50" iconColor="text-blue-500" sub={`Period: ${period}`} />
            <StatCard label="Total Revenue"   value={fmt(data.revenue)}       icon={Coins} iconBg="bg-green-55" iconColor="text-emerald-500" sub="Paid orders only" />
            <StatCard label="Avg Order Value" value={fmt(data.avgOrderValue)} icon={BarChart3} iconBg="bg-orange-50" iconColor="text-amber-500" />
            <StatCard label="Top Product"     value={topProduct}              icon={Trophy} iconBg="bg-violet-50" iconColor="text-violet-500" sub={data.topProducts?.[0] ? `${data.topProducts[0].qty} sold` : ''} />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            <div className="lg:col-span-3 bg-white border-2 border-slate-800 rounded-2xl p-5 shadow-pop-sm text-slate-800">
              <h2 className="text-slate-800 font-black font-outfit mb-4 flex items-center gap-1.5">
                <BarChart3 size={18} className="text-[#34D399]" />
                <span>Revenue Trend</span>
                <span className="text-slate-400 text-xs font-bold ml-2 font-jakarta">Last 7 days</span>
              </h2>
              {data.trendData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.trendData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fill:'#64748B', fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#64748B', fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v}`} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} dot={{ fill:'#F97316', r:4, strokeWidth:1, stroke:'#FFF' }} activeDot={{ r:6 }} />
                    <Line type="monotone" dataKey="orders"  stroke="#3B82F6" strokeWidth={2} dot={{ fill:'#3B82F6', r:3, strokeWidth:1, stroke:'#FFF' }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 font-semibold">No trend data</div>
              )}
              <div className="flex gap-4 mt-2 text-xs text-slate-500 font-bold px-1">
                <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-orange-500 inline-block rounded" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-blue-500 inline-block rounded" /> Orders</span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border-2 border-slate-800 rounded-2xl p-5 shadow-pop-sm text-slate-800">
              <h2 className="text-slate-800 font-black font-outfit mb-4 flex items-center gap-1.5">
                <Tag size={18} className="text-[#8B5CF6]" />
                <span>Sales by Category</span>
              </h2>
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
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#FFFFFF', border:'2px solid #1E293B', borderRadius:12, color:'#1E293B' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                    {data.topCategories.slice(0,5).map((c,i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-800 shadow-pop-sm" style={{ backgroundColor: c.color || `hsl(${i*60},65%,55%)` }} />
                          <span className="text-slate-600">{c.name}</span>
                        </span>
                        <span className="text-slate-800 font-bold font-mono">{fmt(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 font-semibold">No category data</div>
              )}
            </div>
          </div>

          {/* ── Tables ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop-sm">
              <div className="px-4 py-3 bg-slate-50 border-b-2 border-slate-800 flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="text-slate-800 font-bold font-outfit text-sm">Top Products</h3>
              </div>
              <table className="w-full">
                <thead><tr className="text-xs text-slate-500 uppercase border-b-2 border-slate-100 font-bold">
                  <th className="px-4 py-2.5 text-left font-bold">#</th>
                  <th className="px-4 py-2.5 text-left font-bold">Product</th>
                  <th className="px-4 py-2.5 text-right font-bold">Qty</th>
                  <th className="px-4 py-2.5 text-right font-bold">Revenue</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.topProducts||[]).map((p,i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5 text-slate-400 font-mono font-bold">{i+1}</td>
                      <td className="px-4 py-2.5 text-slate-800 font-bold">{p.name}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 font-semibold">{p.qty}</td>
                      <td className="px-4 py-2.5 text-right text-[#8B5CF6] font-black">{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                  {!data.topProducts?.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-xs font-semibold">No data</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop-sm">
              <div className="px-4 py-3 bg-slate-50 border-b-2 border-slate-800 flex items-center gap-2">
                <CreditCard size={16} className="text-violet-500" />
                <h3 className="text-slate-800 font-bold font-outfit text-sm">Highest Orders</h3>
              </div>
              <table className="w-full">
                <thead><tr className="text-xs text-slate-500 uppercase border-b-2 border-slate-100 font-bold">
                  <th className="px-4 py-2.5 text-left font-bold">Order #</th>
                  <th className="px-4 py-2.5 text-right font-bold">Amount</th>
                  <th className="px-4 py-2.5 text-right font-bold">Time</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.topOrders||[]).map((o,i) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5 text-blue-500 font-mono font-bold text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-2.5 text-right text-slate-800 font-black">{fmt(o.total)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400 font-semibold text-xs">
                        {new Date(o.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                  {!data.topOrders?.length && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-xs font-semibold">No data</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop-sm">
              <div className="px-4 py-3 bg-slate-50 border-b-2 border-slate-800 flex items-center gap-2">
                <Tag size={16} className="text-pink-500" />
                <h3 className="text-slate-800 font-bold font-outfit text-sm">Sales by Category</h3>
              </div>
              <table className="w-full">
                <thead><tr className="text-xs text-slate-500 uppercase border-b-2 border-slate-100 font-bold">
                  <th className="px-4 py-2.5 text-left font-bold">Category</th>
                  <th className="px-4 py-2.5 text-right font-bold">Revenue</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.topCategories||[]).map((c,i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor:(c.color||'#6B7280')+'15', color:(c.color||'#6b7280'), border:`1px solid ${c.color||'#6b7280'}33` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color||'#6B7280' }} />
                          {c.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">{fmt(c.revenue)}</td>
                    </tr>
                  ))}
                  {!data.topCategories?.length && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400 text-xs font-semibold">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
