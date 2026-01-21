import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BenefitReport, CompanyReport, MonthlyExpense, ReportSummary } from "@/types/report";
import { formatCurrency } from "./reportsData";

export const exportToPDF = (
  summary: ReportSummary,
  benefits: BenefitReport[],
  companies: CompanyReport[],
  expenses: MonthlyExpense[],
  period: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Benefícios", 14, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${period}`, 14, 35);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - 60, 35);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Summary Section
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", 14, 55);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const summaryData = [
    ["Orçamento Total", formatCurrency(summary.totalBudget)],
    ["Total Gasto", formatCurrency(summary.totalSpent)],
    ["Total de Colaboradores", summary.totalEmployees.toLocaleString("pt-BR")],
    ["Custo Médio por Colaborador", formatCurrency(summary.averagePerEmployee)],
    ["Taxa de Utilização", `${summary.utilizationRate.toFixed(1)}%`],
    ["Taxa de Conformidade", `${summary.complianceRate.toFixed(1)}%`],
  ];
  
  autoTable(doc, {
    startY: 60,
    head: [["Indicador", "Valor"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  });
  
  // Benefits Section
  const finalY1 = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Benefícios por Adesão", 14, finalY1 + 15);
  
  const benefitsData = benefits.map(b => [
    b.name,
    b.category,
    b.enrolled.toLocaleString("pt-BR"),
    `${b.adhesionRate.toFixed(1)}%`,
    formatCurrency(b.monthlyCost),
    `${b.trend === "up" ? "↑" : b.trend === "down" ? "↓" : "→"} ${Math.abs(b.trendValue).toFixed(1)}%`,
  ]);
  
  autoTable(doc, {
    startY: finalY1 + 20,
    head: [["Benefício", "Categoria", "Inscritos", "Adesão", "Custo Mensal", "Tendência"]],
    body: benefitsData,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });
  
  // New page for companies
  doc.addPage();
  
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório por Empresa", 14, 17);
  
  doc.setTextColor(0, 0, 0);
  
  const companiesData = companies.map(c => [
    c.name,
    c.employees.toLocaleString("pt-BR"),
    formatCurrency(c.budget),
    formatCurrency(c.spent),
    `${c.utilization.toFixed(1)}%`,
    c.topBenefits.slice(0, 2).join(", "),
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [["Empresa", "Colaboradores", "Orçamento", "Gasto", "Utilização", "Top Benefícios"]],
    body: companiesData,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });
  
  // Monthly expenses
  const finalY2 = (doc as any).lastAutoTable.finalY || 70;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Gastos Mensais por Categoria", 14, finalY2 + 15);
  
  const expensesData = expenses.slice(-6).map(e => [
    e.month,
    formatCurrency(e.alimentacao),
    formatCurrency(e.saude),
    formatCurrency(e.transporte),
    formatCurrency(e.bemestar),
    formatCurrency(e.outros),
    formatCurrency(e.total),
  ]);
  
  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["Mês", "Alimentação", "Saúde", "Transporte", "Bem-estar", "Outros", "Total"]],
    body: expensesData,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Benefitos - Sistema de Gestão de Benefícios`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  doc.save(`relatorio-beneficios-${new Date().toISOString().split("T")[0]}.pdf`);
};

// CSV utility functions - secure alternative to xlsx
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escape quotes and wrap in quotes if contains special characters
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCSVValue).join(",");
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function downloadCSV(content: string, filename: string) {
  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportToExcel = (
  summary: ReportSummary,
  benefits: BenefitReport[],
  companies: CompanyReport[],
  expenses: MonthlyExpense[]
) => {
  const dateStr = new Date().toISOString().split("T")[0];
  
  // Summary CSV
  const summaryHeaders = ["Indicador", "Valor"];
  const summaryRows: (string | number)[][] = [
    ["Orçamento Total", summary.totalBudget],
    ["Total Gasto", summary.totalSpent],
    ["Total de Colaboradores", summary.totalEmployees],
    ["Custo Médio por Colaborador", summary.averagePerEmployee],
    ["Taxa de Utilização (%)", summary.utilizationRate],
    ["Taxa de Conformidade (%)", summary.complianceRate],
  ];
  
  // Benefits CSV
  const benefitsHeaders = ["Benefício", "Categoria", "Inscritos", "Elegíveis", "Taxa de Adesão (%)", "Custo Mensal", "Tendência", "Variação (%)"];
  const benefitsRows = benefits.map(b => [
    b.name,
    b.category,
    b.enrolled,
    b.eligible,
    b.adhesionRate,
    b.monthlyCost,
    b.trend === "up" ? "Alta" : b.trend === "down" ? "Baixa" : "Estável",
    b.trendValue,
  ]);
  
  // Companies CSV
  const companiesHeaders = ["Empresa", "Colaboradores", "Orçamento", "Gasto", "Utilização (%)", "Top Benefícios"];
  const companiesRows = companies.map(c => [
    c.name,
    c.employees,
    c.budget,
    c.spent,
    c.utilization,
    c.topBenefits.join("; "),
  ]);
  
  // Expenses CSV
  const expensesHeaders = ["Mês", "Alimentação", "Saúde", "Transporte", "Bem-estar", "Outros", "Total"];
  const expensesRows = expenses.map(e => [
    e.month,
    e.alimentacao,
    e.saude,
    e.transporte,
    e.bemestar,
    e.outros,
    e.total,
  ]);
  
  // Combine all into a single CSV with sections
  const sections = [
    "=== RESUMO EXECUTIVO ===",
    arrayToCSV(summaryHeaders, summaryRows),
    "",
    "=== BENEFÍCIOS ===",
    arrayToCSV(benefitsHeaders, benefitsRows),
    "",
    "=== EMPRESAS ===",
    arrayToCSV(companiesHeaders, companiesRows),
    "",
    "=== GASTOS MENSAIS ===",
    arrayToCSV(expensesHeaders, expensesRows),
  ];
  
  const fullContent = sections.join("\n");
  downloadCSV(fullContent, `relatorio-beneficios-${dateStr}.csv`);
};
