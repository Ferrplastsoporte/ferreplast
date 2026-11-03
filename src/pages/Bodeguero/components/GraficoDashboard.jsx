import '../css/grafico-dashboard.css';

// Gráficos SVG locales. La configuración sólo describe datos y presentación;
// no requiere ECharts ni ejecuta código de bibliotecas de gráficos.
export default function GraficoDashboard({ option, onEvents = {}, style }) {
  const series = option.series ?? [];
  const pie = series[0]?.type === 'pie';
  const horizontal = option.yAxis?.type === 'category';
  const labels = (horizontal ? option.yAxis : option.xAxis)?.data ?? [];
  const value = (item) => Math.max(0, Number(item?.value ?? item) || 0);
  const color = (s, item) => item?.itemStyle?.color ?? s.itemStyle?.color ?? '#2563eb';
  const activate = (event, dataIndex, seriesIndex) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointer = event.type === 'keydown' ? { clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 } : event;
    onEvents.click?.({ dataIndex, seriesIndex, event: { event: pointer } });
  };
  const interactive = (label, i, s) => ({
    role: 'button', tabIndex: 0, 'aria-label': label,
    onClick: (e) => activate(e, i, s),
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e, i, s); } },
  });
  const total = pie ? series[0].data.reduce((sum, d) => sum + value(d), 0) : 0;
  const left = horizontal ? 170 : 45, right = 600, top = 20, bottom = 235;
  const stacked = series.some((s) => s.stack);
  const maxValue = Math.max(1, ...labels.map((_, i) => stacked
    ? series.reduce((sum, s) => sum + value(s.data[i]), 0)
    : Math.max(0, ...series.map((s) => value(s.data[i])))));
  const max = Math.max(1, Math.ceil(maxValue / 4)) * 4;
  const step = (horizontal ? bottom - top : right - left) / Math.max(1, labels.length);
  const x = (i) => left + step * (i + 0.5);
  const y = (v) => bottom - v / max * (bottom - top);
  return <div className="grafico-dashboard" style={style}>
    <svg viewBox="0 0 640 280" role="group" aria-label={pie ? 'Distribución de pedidos por estado' : horizontal ? 'Productos vendidos' : 'Cantidad de pedidos'}>
      {pie ? <>
        <circle cx="320" cy="140" r="90" fill="none" stroke="#e2e8f0" strokeWidth="32" />
        {series[0].data.map((d, i) => {
          const fraction = total ? value(d) / total : 0;
          const offset = total ? series[0].data.slice(0, i).reduce((sum, item) => sum + value(item), 0) / total : 0;
          const label = d.name + ': ' + value(d) + ' (' + Math.round(fraction * 100) + '%)';
          return fraction > 0 && <circle key={i} cx="320" cy="140" r="90" fill="none" stroke={color(series[0], d)} strokeWidth="32"
            pathLength="100" strokeDasharray={fraction * 100 + ' ' + (100 - fraction * 100)} strokeDashoffset={-offset * 100}
            transform="rotate(-90 320 140)" {...interactive(label, i, 0)}><title>{label}</title></circle>;
        })}
        <text x="320" y="140" textAnchor="middle" className="grafico-dashboard__total">{total}</text>
        <text x="320" y="163" textAnchor="middle">pedidos</text>
      </> : <>
        {[0, 1, 2, 3, 4].map((tick) => {
          const v = max * tick / 4;
          return <g key={tick}>
            <line x1={horizontal ? left + v / max * (right - left) : left} x2={horizontal ? left + v / max * (right - left) : right}
              y1={horizontal ? top : y(v)} y2={horizontal ? bottom : y(v)} stroke="#e2e8f0" />
            <text x={horizontal ? left + v / max * (right - left) : left - 8} y={horizontal ? bottom + 20 : y(v) + 4} textAnchor={horizontal ? 'middle' : 'end'}>{v}</text>
          </g>;
        })}
        {labels.map((label, i) => <text key={i} x={horizontal ? left - 10 : x(i)} y={horizontal ? top + step * (i + 0.5) + 4 : bottom + 20}
          textAnchor={horizontal ? 'end' : 'middle'} {...(horizontal ? interactive(label + ': ' + value(series[0]?.data[i]), i, 0) : {})}>
          <title>{label}</title>{String(label).length > (horizontal ? 23 : 12) ? String(label).slice(0, horizontal ? 21 : 10) + '…' : label}
        </text>)}
        {series.map((s, si) => <g key={si}>
          {s.type === 'line' && <polyline fill="none" stroke={color(s)} strokeWidth="2.5" points={s.data.map((d, i) => x(i) + ',' + y(value(d))).join(' ')} />}
          {s.data.map((d, i) => {
            const v = value(d), label = labels[i] + (s.name ? ' · ' + s.name : '') + ': ' + v;
            const base = stacked ? series.slice(0, si).reduce((sum, prev) => sum + value(prev.data[i]), 0) : 0;
            const width = Math.min(step * 0.65, s.barMaxWidth ?? 32);
            return <g key={i} {...interactive(label, i, si)}>
              <title>{label}</title>
              {s.type === 'line' ? <circle cx={x(i)} cy={y(v)} r="5" fill={color(s, d)} /> : horizontal ? <>
                <rect x={left} y={top + step * (i + 0.5) - 9} width={Math.max(3, v / max * (right - left))} height="18" rx="3" fill={color(s, d)} />
                <text x={left + v / max * (right - left) + 8} y={top + step * (i + 0.5) + 4}>{v}</text>
              </> : <>
                <rect x={x(i) - width / 2} y={y(base + v) - (v === 0 ? 3 : 0)} width={width} height={Math.max(3, v / max * (bottom - top))} rx="2" fill={color(s, d)} />
                {s.label?.show && <text x={x(i)} y={y(base + v) - 7} textAnchor="middle">{v}</text>}
              </>}
            </g>;
          })}
        </g>)}
      </>}
    </svg>
  </div>;
}
