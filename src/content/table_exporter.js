// Aura Tab - HTML Table to Excel-Ready CSV Exporter

(function () {
  window.AuraTableExporter = {
    scanAndExport: function () {
      const tables = Array.from(document.querySelectorAll('table')).filter(t => {
        // Filter out hidden or tracking tables
        const rect = t.getBoundingClientRect();
        return rect.width > 50 && rect.height > 50 && t.querySelectorAll('tr').length > 1;
      });

      if (tables.length === 0) {
        window.AuraEdgeHandle?.showToast('No exportable tables found on this page.');
        return;
      }

      if (tables.length === 1) {
        window.AuraTableExporter.exportTable(tables[0], 1);
      } else {
        // Overlay floating export buttons on each table
        tables.forEach((table, index) => {
          window.AuraTableExporter.attachExportButton(table, index + 1);
        });
        window.AuraEdgeHandle?.showToast(`Found ${tables.length} tables. Click an export button above any table.`);
      }
    },

    attachExportButton: function (table, index) {
      if (table.dataset.auraExportAttached) return;
      table.dataset.auraExportAttached = 'true';

      const rect = table.getBoundingClientRect();
      const btn = document.createElement('button');
      btn.className = 'aura-table-export-btn';
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Export Table ${index}</span>
      `;

      // Position relative to page scroll
      const top = window.scrollY + rect.top + 8;
      const left = window.scrollX + rect.left + 8;
      btn.style.top = `${top}px`;
      btn.style.left = `${left}px`;

      btn.addEventListener('click', () => {
        window.AuraTableExporter.exportTable(table, index);
        btn.remove();
        delete table.dataset.auraExportAttached;
      });

      document.body.appendChild(btn);

      // Auto-remove button after 12 seconds
      setTimeout(() => {
        if (btn.parentNode) btn.remove();
        delete table.dataset.auraExportAttached;
      }, 12000);
    },

    exportTable: function (table, index = 1) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return;

      const csvRows = [];

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const rowData = cells.map(cell => {
          let text = cell.innerText || cell.textContent || '';
          // Clean up multi-line formatting and whitespace
          text = text.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
          // Escape quotes
          text = text.replace(/"/g, '""');
          return `"${text}"`;
        });
        csvRows.push(rowData.join(','));
      }

      const csvString = csvRows.join('\r\n');
      // Prepend UTF-8 BOM so Excel opens international characters without corruption
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const domain = window.location.hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `table_${domain}_${index}_${new Date().toISOString().slice(0, 10)}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      window.AuraEdgeHandle?.showToast(`Exported ${rows.length} rows to ${filename}`);
    }
  };
})();

