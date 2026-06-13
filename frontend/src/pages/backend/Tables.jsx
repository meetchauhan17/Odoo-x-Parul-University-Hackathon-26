import { useEffect, useState, useRef } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { LayoutGrid, Plus, Trash2, X, User, HelpCircle, Move } from 'lucide-react';

function getTableDimensions(shape) {
  switch (shape) {
    case 'circle': return { w: 2, h: 2 };
    case 'rectangle_h': return { w: 3, h: 2 };
    case 'rectangle_v': return { w: 2, h: 3 };
    case 'square':
    default: return { w: 2, h: 2 };
  }
}

function findFreeSpot(existingTables, shape) {
  const { w, h } = getTableDimensions(shape);
  // Grid size: 24 cols x 16 rows
  for (let y = 0; y <= 16 - h; y++) {
    for (let x = 0; x <= 24 - w; x++) {
      const overlap = existingTables.some(t => {
        const tw = getTableDimensions(t.shape).w;
        const th = getTableDimensions(t.shape).h;
        return !(x + w <= t.x || t.x + tw <= x || y + h <= t.y || t.y + th <= y);
      });
      if (!overlap) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

export default function Tables() {
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  
  // Forms state
  const [floorName, setFloorName] = useState('');
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ tableNumber: '', seats: 4, shape: 'square' });
  
  // Dragging state
  const canvasRef = useRef(null);
  const [draggingTable, setDraggingTable] = useState(null);

  const load = async () => {
    try {
      const [f, t] = await Promise.all([api.get('/floors'), api.get('/tables')]);
      setFloors(f);
      setTables(t);
      setSelectedFloor(prev => (!prev && f.length > 0) ? f[0].id : prev);
    } catch (error) {
      toast.error('Failed to load floor/table data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTables = tables.filter(t => t.floorId === selectedFloor && t.isActive);
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const addFloor = async (e) => {
    e.preventDefault();
    if (!floorName.trim()) return;
    try {
      await api.post('/floors', { name: floorName });
      setFloorName('');
      setShowAddFloorModal(false);
      toast.success('Floor added');
      load();
    } catch {
      toast.error('Failed to add floor');
    }
  };

  const deleteFloor = async (id) => {
    if (!window.confirm('Delete this floor? All tables on it will be hidden.')) return;
    try {
      await api.delete(`/floors/${id}`);
      toast.success('Floor deleted');
      setSelectedFloor(null);
      setSelectedTableId(null);
      load();
    } catch {
      toast.error('Failed to delete floor');
    }
  };

  const addTable = async (e) => {
    e.preventDefault();
    if (!newTableForm.tableNumber.trim()) return;

    // Determine an empty grid spot
    const { x, y } = findFreeSpot(filteredTables, newTableForm.shape);

    try {
      await api.post('/tables', {
        tableNumber: newTableForm.tableNumber,
        seats: newTableForm.seats,
        shape: newTableForm.shape,
        floorId: selectedFloor,
        x,
        y
      });
      setNewTableForm({ tableNumber: '', seats: 4, shape: 'square' });
      toast.success('Table added');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add table');
    }
  };

  const updateTableField = async (tableId, fields) => {
    try {
      // Optimistic state update
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, ...fields } : t));
      await api.put(`/tables/${tableId}`, fields);
      toast.success('Table updated');
    } catch (error) {
      toast.error('Failed to update table');
      load();
    }
  };

  const deleteTable = async (id) => {
    if (!window.confirm('Remove this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table removed');
      setSelectedTableId(null);
      load();
    } catch {
      toast.error('Failed to delete table');
    }
  };

  // Dragging event handlers
  const handlePointerDown = (e, table) => {
    // Only drag with left click or primary touch point
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.no-drag')) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cellWidth = rect.width / 24;
    const cellHeight = rect.height / 16;

    const dimensions = getTableDimensions(table.shape);

    setDraggingTable({
      id: table.id,
      w: dimensions.w,
      h: dimensions.h,
      startX: table.x,
      startY: table.y,
      currentX: table.x,
      currentY: table.y,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      cellWidth,
      cellHeight,
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingTable) return;
    
    const deltaX = e.clientX - draggingTable.startPointerX;
    const deltaY = e.clientY - draggingTable.startPointerY;

    const gridDeltaX = Math.round(deltaX / draggingTable.cellWidth);
    const gridDeltaY = Math.round(deltaY / draggingTable.cellHeight);

    let newX = draggingTable.startX + gridDeltaX;
    let newY = draggingTable.startY + gridDeltaY;

    // Clamp coordinates to grid
    newX = Math.max(0, Math.min(24 - draggingTable.w, newX));
    newY = Math.max(0, Math.min(16 - draggingTable.h, newY));

    setDraggingTable(prev => ({
      ...prev,
      currentX: newX,
      currentY: newY
    }));
  };

  const handlePointerUp = async (e) => {
    if (!draggingTable) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);

    const { id, currentX, currentY, startX, startY } = draggingTable;
    setDraggingTable(null);

    if (currentX === startX && currentY === startY) {
      // Toggle select for editing if click/tap without moving
      setSelectedTableId(prev => prev === id ? null : id);
      return;
    }

    // Coordinates changed, save positions
    try {
      setTables(prev => prev.map(t => t.id === id ? { ...t, x: currentX, y: currentY } : t));
      await api.put(`/tables/${id}`, { x: currentX, y: currentY });
      toast.success('Table layout updated');
    } catch {
      toast.error('Failed to save table position');
      load();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold font-jakarta">Loading...</div>;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid size={24} className="text-[#8B5CF6]" />
          <h1 className="text-2xl font-black text-slate-800 font-outfit">Floor Plan Designer</h1>
        </div>
        <button
          onClick={() => setShowAddFloorModal(true)}
          className="bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 rounded-xl font-bold px-4 py-2.5 text-sm shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Floor
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1">
        {/* Floors Sidebar */}
        <div className="w-full lg:w-48 shrink-0">
          <div className="text-xs text-slate-500 uppercase font-bold mb-3 px-1 font-jakarta">Floors</div>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {floors.map(f => (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFloor(f.id);
                  setSelectedTableId(null);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer border-2 transition-all duration-200 shrink-0 lg:shrink ${
                  selectedFloor === f.id
                    ? 'bg-[#8B5CF6] text-white border-slate-800 shadow-pop-sm translate-y-[-1px]'
                    : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200'
                }`}
              >
                <span className="text-sm font-bold font-outfit pr-2">{f.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteFloor(f.id); }}
                  className={`p-1 rounded-md transition ${selectedFloor === f.id ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {floors.length === 0 && <div className="text-slate-400 text-xs px-1 font-semibold font-jakarta">No floors yet</div>}
          </div>
        </div>

        {/* Designer Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFloor ? (
            <div className="flex flex-col md:flex-row gap-6 items-start flex-1">
              {/* Canvas Area */}
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-slate-500 text-xs md:text-sm font-semibold flex items-center gap-1.5 font-jakarta">
                    <Move size={14} className="text-slate-400" />
                    <span>Drag tables to move. Tap table to customize properties.</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase font-jakarta">Canvas 24x16</div>
                </div>

                {/* Grid Canvas */}
                <div
                  ref={canvasRef}
                  className="relative w-full border-4 border-slate-800 rounded-3xl bg-[#FFFDF5] bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] shadow-pop-md overflow-hidden select-none"
                  style={{ aspectRatio: '24 / 16' }}
                >
                  {/* Grid Lines Rendering */}
                  {filteredTables.map(t => {
                    const isDragging = draggingTable && draggingTable.id === t.id;
                    const x = isDragging ? draggingTable.currentX : t.x;
                    const y = isDragging ? draggingTable.currentY : t.y;
                    const { w, h } = getTableDimensions(t.shape);
                    const isEditing = selectedTableId === t.id;

                    let shapeClass = 'rounded-xl';
                    let bgClass = 'bg-[#FBBF24]'; // square default yellow
                    
                    if (t.shape === 'circle') {
                      shapeClass = 'rounded-full';
                      bgClass = 'bg-[#FF8A65]'; // orange-coral
                    } else if (t.shape === 'rectangle_h' || t.shape === 'rectangle_v') {
                      shapeClass = 'rounded-xl';
                      bgClass = 'bg-[#2DD4BF]'; // teal
                    }

                    return (
                      <div
                        key={t.id}
                        onPointerDown={(e) => handlePointerDown(e, t)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{
                          left: `${(x / 24) * 100}%`,
                          top: `${(y / 16) * 100}%`,
                          width: `${(w / 24) * 100}%`,
                          height: `${(h / 16) * 100}%`,
                          position: 'absolute',
                          cursor: 'move',
                          touchAction: 'none'
                        }}
                        className={`flex flex-col items-center justify-center border-2 border-slate-800 transition-all select-none duration-75 ${shapeClass} ${bgClass} ${
                          isEditing 
                            ? 'ring-[3px] ring-violet-600 ring-offset-2 z-20 shadow-none' 
                            : isDragging 
                              ? 'opacity-75 scale-95 z-30 shadow-none' 
                              : 'shadow-pop-sm hover:translate-y-[-1px] hover:shadow-pop z-10'
                        }`}
                      >
                        <span className="font-outfit font-black text-slate-800 text-[11px] sm:text-xs md:text-sm lg:text-base leading-none mb-0.5 select-none">{t.tableNumber}</span>
                        <span className="font-jakarta text-slate-700 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs leading-none flex items-center gap-0.5 select-none">
                          <span>{t.seats}</span>
                          <span className="text-[7px] sm:text-[8px] md:text-[9px]">👤</span>
                        </span>
                        {t.currentOrderId && (
                          <span className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                  
                  {filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#FFFDF5]/40 pointer-events-none">
                      <HelpCircle size={32} className="text-slate-300 mb-2" />
                      <span className="font-bold text-slate-400 text-sm font-jakarta">No tables on this floor plan.</span>
                      <span className="text-xs text-slate-400 mt-1 font-jakarta">Add a table using the editor sidebar on the right!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Settings Panel */}
              <div className="w-full md:w-64 shrink-0 bg-white border-2 border-slate-800 rounded-3xl p-5 shadow-pop-sm">
                {selectedTable ? (
                  /* Edit Table Properties */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-outfit font-black text-slate-800 text-base">Edit Table {selectedTable.tableNumber}</h3>
                      <button
                        onClick={() => setSelectedTableId(null)}
                        className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-50 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-jakarta">Table Number *</label>
                      <input
                        type="text"
                        value={selectedTable.tableNumber}
                        onChange={e => updateTableField(selectedTable.id, { tableNumber: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B5CF6] transition font-bold font-outfit"
                        placeholder="e.g. T1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-jakarta">Seating Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedTable.seats}
                        onChange={e => updateTableField(selectedTable.id, { seats: parseInt(e.target.value, 10) || 1 })}
                        className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B5CF6] transition font-bold font-jakarta"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 font-jakarta">Shape & Grid Size</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'square', label: 'Square (2x2)', color: 'bg-[#FBBF24]' },
                          { id: 'circle', label: 'Circle (2x2)', color: 'bg-[#FF8A65] rounded-full' },
                          { id: 'rectangle_h', label: 'Rect H (3x2)', color: 'bg-[#2DD4BF]' },
                          { id: 'rectangle_v', label: 'Rect V (2x3)', color: 'bg-[#2DD4BF]' }
                        ].map(shapeOpt => (
                          <button
                            key={shapeOpt.id}
                            type="button"
                            onClick={() => updateTableField(selectedTable.id, { shape: shapeOpt.id })}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition text-center ${
                              selectedTable.shape === shapeOpt.id
                                ? 'border-slate-800 bg-slate-50 ring-2 ring-[#8B5CF6] ring-offset-1 font-bold'
                                : 'border-slate-100 hover:border-slate-200 text-slate-500 text-xs'
                            }`}
                          >
                            <div className={`w-5 h-5 mb-1.5 border border-slate-800 shadow-pop-xs ${shapeOpt.color}`} />
                            <span className="text-[10px] font-semibold font-jakarta">{shapeOpt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => deleteTable(selectedTable.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl transition font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <Trash2 size={13} /> Delete Table
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTableId(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl transition font-bold text-xs"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Create/Add New Table Form */
                  <form onSubmit={addTable} className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-outfit font-black text-slate-800 text-base">Add New Table</h3>
                      <p className="text-[11px] text-slate-400 font-jakarta mt-0.5">Places table in first empty spot.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-jakarta">Table Number *</label>
                      <input
                        required
                        type="text"
                        value={newTableForm.tableNumber}
                        onChange={e => setNewTableForm({ ...newTableForm, tableNumber: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B5CF6] transition font-bold font-outfit"
                        placeholder="e.g. T5"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-jakarta">Seating Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={newTableForm.seats}
                        onChange={e => setNewTableForm({ ...newTableForm, seats: parseInt(e.target.value, 10) || 4 })}
                        className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B5CF6] transition font-bold font-jakarta"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 font-jakarta">Shape & Layout</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'square', label: 'Square (2x2)', color: 'bg-[#FBBF24]' },
                          { id: 'circle', label: 'Circle (2x2)', color: 'bg-[#FF8A65] rounded-full' },
                          { id: 'rectangle_h', label: 'Rect H (3x2)', color: 'bg-[#2DD4BF]' },
                          { id: 'rectangle_v', label: 'Rect V (2x3)', color: 'bg-[#2DD4BF]' }
                        ].map(shapeOpt => (
                          <button
                            key={shapeOpt.id}
                            type="button"
                            onClick={() => setNewTableForm({ ...newTableForm, shape: shapeOpt.id })}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition text-center ${
                              newTableForm.shape === shapeOpt.id
                                ? 'border-slate-800 bg-slate-50 ring-2 ring-[#8B5CF6] ring-offset-1 font-bold'
                                : 'border-slate-100 hover:border-slate-200 text-slate-500 text-xs'
                            }`}
                          >
                            <div className={`w-5 h-5 mb-1.5 border border-slate-800 shadow-pop-xs ${shapeOpt.color}`} />
                            <span className="text-[10px] font-semibold font-jakarta">{shapeOpt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                    >
                      <Plus size={16} /> Spawn Table
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border-4 border-dashed border-slate-200 rounded-3xl bg-white text-slate-400 font-bold font-jakarta text-sm">
              Select or create a floor on the left to start layout design
            </div>
          )}
        </div>
      </div>

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-800 rounded-2xl w-full max-w-md shadow-pop-lg animate-popIn">
            <div className="flex items-center justify-between p-5 border-b-2 border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 font-outfit">Add Floor</h2>
              <button onClick={() => setShowAddFloorModal(false)} className="text-slate-400 hover:text-slate-800 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <form onSubmit={addFloor} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 font-jakarta">Floor Name *</label>
                  <input
                    required
                    value={floorName}
                    onChange={e => setFloorName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8B5CF6] transition font-semibold font-jakarta"
                    placeholder="e.g. Ground Floor"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFloorModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]"
                  >
                    Add Floor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
