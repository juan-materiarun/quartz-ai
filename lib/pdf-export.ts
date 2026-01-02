import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditResult } from '@/types';

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export function exportToPDF(result: AuditResult, url: string = '') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ========== HEADER CON MARCA ==========
  // Fondo degradado simulado con rectángulos
  doc.setFillColor(56, 189, 248); // #38bdf8
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo/Marca QUARTZ AI
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('QUARTZ AI', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank-Grade Testing Automation', pageWidth / 2, 28, { align: 'center' });
  
  // Línea decorativa
  doc.setDrawColor(14, 165, 233); // #0ea5e9
  doc.setLineWidth(2);
  doc.line(15, 35, pageWidth - 15, 35);
  
  yPosition = 50;

  // ========== INFORMACIÓN DEL REPORTE ==========
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Report', 15, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // #475569
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, yPosition);
  
  if (url) {
    yPosition += 6;
    doc.text(`URL: ${url}`, 15, yPosition);
  }
  
  yPosition += 10;

  // ========== ESTADÍSTICAS ==========
  const criticalCount = result.defects.filter(d => d.priority === 'Critical').length;
  const mediumCount = result.defects.filter(d => d.priority === 'Medium').length;
  const lowCount = result.defects.filter(d => d.priority === 'Low').length;
  const totalTests = result.passedTests.length + result.defects.length;
  const score = totalTests === 0 ? 100 : Math.round((result.passedTests.length / totalTests) * 100);

  // Cajas de estadísticas
  const boxWidth = (pageWidth - 40) / 4;
  const boxHeight = 25;
  const boxY = yPosition;
  
  // Función helper para dibujar caja de estadística
  const drawStatBox = (x: number, label: string, value: string, color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2], 0.1);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + boxWidth / 2, boxY + 8, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + boxWidth / 2, boxY + 20, { align: 'center' });
  };

  drawStatBox(15, 'Passed Tests', result.passedTests.length.toString(), [16, 185, 129]); // green
  drawStatBox(15 + boxWidth + 3, 'Total Defects', result.defects.length.toString(), [239, 68, 68]); // red
  drawStatBox(15 + (boxWidth + 3) * 2, 'Critical', criticalCount.toString(), [245, 158, 11]); // orange
  drawStatBox(15 + (boxWidth + 3) * 3, 'Score', `${score}%`, score >= 80 ? [16, 185, 129] : [239, 68, 68]);
  
  yPosition = boxY + boxHeight + 15;

  // ========== DEFECTS TABLE ==========
  if (result.defects.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Defects Found', 15, yPosition);
    yPosition += 8;

    const defectsData = result.defects.map((defect) => [
      defect.id,
      defect.priority,
      defect.category,
      defect.title,
      defect.description.substring(0, 100) + (defect.description.length > 100 ? '...' : ''),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Priority', 'Category', 'Title', 'Description']],
      body: defectsData,
      theme: 'striped',
      headStyles: {
        fillColor: [56, 189, 248],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 'auto' },
      },
      margin: { left: 15, right: 15 },
      didDrawCell: (data) => {
        // Colorear prioridades
        if (data.column.index === 1 && data.section === 'body') {
          const priority = data.cell.raw as string;
          if (priority === 'Critical') {
            doc.setTextColor(239, 68, 68);
          } else if (priority === 'Medium') {
            doc.setTextColor(245, 158, 11);
          } else {
            doc.setTextColor(148, 163, 184);
          }
          doc.text(priority, data.cell.x + 2, data.cell.y + 5);
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========== PASSED TESTS TABLE ==========
  if (result.passedTests.length > 0) {
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Passed Tests', 15, yPosition);
    yPosition += 8;

    const passedData = result.passedTests.map((test) => [
      test.category,
      test.test,
      '✓ Passed',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Test', 'Status']],
      body: passedData,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, fontStyle: 'bold', textColor: [16, 185, 129] },
      },
      margin: { left: 15, right: 15 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========== FOOTER ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Línea de separación
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Texto del footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Generated by QUARTZ AI - Bank-Grade Testing Automation',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Número de página
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // ========== GUARDAR PDF ==========
  const fileName = `Quartz_AI_Audit_Report_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

