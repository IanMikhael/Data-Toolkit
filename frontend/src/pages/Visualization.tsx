import { useState } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { BarChart2, Settings2, Plus, AlertCircle, PieChart, LineChart, LayoutGrid, Type, Trash2, Loader2, Palette } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export default function Visualization() {
  const { result } = useDataStore();
  
  // Dashboard State (Menyimpan banyak widget)
  const [widgets, setWidgets] = useState<any[]>([]);
  
  // Widget Builder State
  const [widgetMode, setWidgetMode] = useState<'chart' | 'text'>('chart');
  const [widgetTitle, setWidgetTitle] = useState('');
  
  // Chart Config
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [aggFunc, setAggFunc] = useState('sum');
  const [colorTheme, setColorTheme] = useState('blue');
  const [sortByValue, setSortByValue] = useState(true);
  
  // Text Config
  const [textContent, setTextContent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500">
         <AlertCircle size={64} className="mb-4 text-slate-300" />
         <h2 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Dataset</h2>
         <p>Silakan upload dataset di menu <b>Data Explorer</b> terlebih dahulu.</p>
      </div>
    );
  }

  const columns = Object.keys(result.dtypes);

  const themeColors: Record<string, string[]> = {
    blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    emerald: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    rose: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3'],
    amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
    purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
  };

  const handleAddWidget = async () => {
    if (widgetMode === 'text') {
      if (!textContent) { setError("Isi teks terlebih dahulu."); return; }
      setWidgets([...widgets, { id: Date.now(), type: 'text', title: widgetTitle, content: textContent }]);
      setWidgetTitle(''); setTextContent(''); setError(null);
      return;
    }

    // Chart Mode
    if (!xAxis || !yAxis) { setError("Pilih Sumbu X dan Sumbu Y terlebih dahulu."); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/analysis/aggregate', {
        file_path: result.file_path,
        x_column: xAxis,
        y_column: yAxis,
        agg_func: aggFunc,
        sort_by_value: sortByValue
      });
      
      if (response.data?.data?.categories) {
        setWidgets([...widgets, {
          id: Date.now(),
          type: 'chart',
          title: widgetTitle || `${aggFunc.toUpperCase()} of ${yAxis}`,
          chartType, xAxis, yAxis, colorTheme,
          data: response.data.data
        }]);
        setWidgetTitle('');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal memproses data grafik');
    } finally {
      setLoading(false);
    }
  };

  const removeWidget = (id: number) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const getChartOptions = (widget: any) => {
    const isPie = widget.chartType === 'pie';
    const colors = themeColors[widget.colorTheme] || themeColors.blue;

    const options: any = {
      color: colors,
      tooltip: {
        trigger: isPie ? 'item' : 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        textStyle: { color: '#1e293b' }
      },
      toolbox: {
        feature: { saveAsImage: { title: 'Save', name: `chart_${widget.id}` } }
      },
      series: [
        {
          name: widget.data.y_column,
          type: widget.chartType,
          smooth: widget.chartType === 'line',
          data: isPie 
            ? widget.data.categories.map((c: any, i: number) => ({ name: String(c || 'Unknown'), value: widget.data.values[i] }))
            : widget.data.values,
          itemStyle: { borderRadius: widget.chartType === 'bar' ? [4, 4, 0, 0] : 0 },
          areaStyle: widget.chartType === 'line' ? { opacity: 0.2 } : undefined
        }
      ]
    };

    if (!isPie) {
      options.xAxis = {
        type: 'category',
        data: widget.data.categories.map((c: any) => String(c || 'Unknown')),
        axisLabel: { rotate: 30, color: '#64748b' }
      };
      options.yAxis = { type: 'value', axisLabel: { color: '#64748b' } };
      options.grid = { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true };
    }

    return options;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><LayoutGrid size={28} /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Builder</h2>
            <p className="text-slate-500">Rakit dashboard multi-panel Anda sendiri.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* PANEL KIRI: WIDGET BUILDER */}
        <div className="xl:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-5 h-max sticky top-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <Settings2 size={18} className="text-blue-500" /> Buat Widget Baru
          </h3>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setWidgetMode('chart')} className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition ${widgetMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><BarChart2 size={16}/> Grafik</button>
            <button onClick={() => setWidgetMode('text')} className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition ${widgetMode === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Type size={16}/> Teks/Judul</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Judul Widget (Opsional)</label>
              <input type="text" value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} placeholder="Contoh: Pendapatan Cabang" className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
            </div>

            {widgetMode === 'text' ? (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Isi Teks</label>
                <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Ketik teks penjelasan atau catatan dashboard di sini..." rows={4} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none" />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tipe Grafik</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ id: 'bar', icon: BarChart2 }, { id: 'line', icon: LineChart }, { id: 'pie', icon: PieChart }, { id: 'scatter', icon: LayoutGrid }].map(type => (
                      <button key={type.id} onClick={() => setChartType(type.id)} className={`p-2 flex justify-center rounded-lg border transition ${chartType === type.id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}><type.icon size={20} /></button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Sumbu X (Kategori)</label>
                  <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                    <option value="">-- Pilih Kolom --</option>{columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Sumbu Y (Metrik)</label>
                  <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                    <option value="">-- Pilih Kolom --</option>{columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Agregasi</label>
                    <select value={aggFunc} onChange={(e) => setAggFunc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                      <option value="sum">SUM</option><option value="avg">AVG</option><option value="count">COUNT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Warna</label>
                    <select value={colorTheme} onChange={(e) => setColorTheme(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 capitalize">
                      {Object.keys(themeColors).map(color => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</div>}

            <button onClick={handleAddWidget} disabled={loading} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Add to Dashboard
            </button>
          </div>
        </div>

        {/* PANEL KANAN: DASHBOARD CANVAS */}
        <div className="xl:col-span-3">
          {widgets.length === 0 ? (
            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <LayoutGrid size={48} className="mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">Dashboard Anda Masih Kosong</p>
              <p className="text-sm">Rakit grafik atau teks di panel kiri lalu klik "Add to Dashboard".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {widgets.map((widget) => (
                <div key={widget.id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col ${widget.type === 'text' ? 'md:col-span-2' : 'col-span-1'}`}>
                  
                  <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      {widget.type === 'text' ? <Type size={16} className="text-slate-400"/> : <Palette size={16} style={{color: themeColors[widget.colorTheme]?.[0]}} />}
                      {widget.title}
                    </h4>
                    <button onClick={() => removeWidget(widget.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="p-5">
                    {widget.type === 'text' ? (
                      <div className="text-slate-600 whitespace-pre-wrap">{widget.content}</div>
                    ) : (
                      <div className="w-full h-[300px]">
                        <ReactECharts 
                          option={getChartOptions(widget)} 
                          style={{ height: '100%', width: '100%' }}
                          notMerge={true} lazyUpdate={true}
                        />
                      </div>
                    )}
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
