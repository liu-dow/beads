import type { Design } from "@/lib/design";

// The same cells and palette feed the flat chart and the bracelet preview.
// This is an exact excerpt, not an illustrative pattern or an editable canvas.
export function BeadPatternPreview({ design, full = false }: { design: Design; full?: boolean }) {
  const columns = full ? design.cols : Math.min(Math.max(32, design.rows + 4), design.cols);
  const pitch = 12, left = 22, top = 20;
  const width = columns * pitch + left + 8, height = (design.rows + .5) * pitch + top + 8;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${design.title} — ${full ? "complete" : `columns 1 to ${columns} of the`} 2D bead chart`}>
    <g fill="#777c72" fontFamily="Arial, sans-serif" fontSize="8" textAnchor="middle">
      {Array.from({ length: columns }, (_, col) => (col === 0 || (col + 1) % (full ? 16 : 8) === 0) && <text key={col} x={left + col * pitch + 5} y="10">{col + 1}</text>)}
      {Array.from({ length: design.rows }, (_, row) => row % 5 === 0 && <text key={row} x="7" y={top + row * pitch + 8}>{row + 1}</text>)}
    </g>
    <g data-pattern-grid="true">
      {design.cells.flatMap((paletteIndex, index) => {
        const col = index % design.cols, row = Math.floor(index / design.cols);
        return col < columns ? <rect key={index} data-chart-cell={index} data-palette={paletteIndex} x={left + col * pitch} y={top + (row + (col % 2) * .5) * pitch} width="11" height="11" rx="1" fill={design.palette[paletteIndex].hex} stroke="#253b3020" strokeWidth=".5"/> : [];
      })}
    </g>
  </svg>;
}
