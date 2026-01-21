import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

export const exportToExcel = (
  summary: ReportSummary,
  benefits: BenefitReport[],
  companies: CompanyReport[],
  expenses: MonthlyExpense[]
) => {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Relatório de Benefícios - Resumo Executivo"],
    [""],
    ["Indicador", "Valor"],
    ["Orçamento Total", summary.totalBudget],
    ["Total Gasto", summary.totalSpent],
    ["Total de Colaboradores", summary.totalEmployees],
    ["Custo Médio por Colaborador", summary.averagePerEmployee],
    ["Taxa de Utilização (%)", summary.utilizationRate],
    ["Taxa de Conformidade (%)", summary.complianceRate],
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
  
  // Benefits sheet
  const benefitsData = benefits.map(b => ({
    "Benefício": b.name,
    "Categoria": b.category,
    "Inscritos": b.enrolled,
    "Elegíveis": b.eligible,
    "Taxa de Adesão (%)": b.adhesionRate,
    "Custo Mensal": b.monthlyCost,
    "Tendência": b.trend === "up" ? "Alta" : b.trend === "down" ? "Baixa" : "Estável",
    "Variação (%)": b.trendValue,
  }));
  const benefitsSheet = XLSX.utils.json_to_sheet(benefitsData);
  XLSX.utils.book_append_sheet(workbook, benefitsSheet, "Benefícios");
  
  // Companies sheet
  const companiesData = companies.map(c => ({
    "Empresa": c.name,
    "Colaboradores": c.employees,
    "Orçamento": c.budget,
    "Gasto": c.spent,
    "Utilização (%)": c.utilization,
    "Top Benefícios": c.topBenefits.join(", "),
  }));
  const companiesSheet = XLSX.utils.json_to_sheet(companiesData);
  XLSX.utils.book_append_sheet(workbook, companiesSheet, "Empresas");
  
  // Monthly expenses sheet
  const expensesData = expenses.map(e => ({
    "Mês": e.month,
    "Alimentação": e.alimentacao,
    "Saúde": e.saude,
    "Transporte": e.transporte,
    "Bem-estar": e.bemestar,
    "Outros": e.outros,
    "Total": e.total,
  }));
  const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, "Gastos Mensais");
  
  XLSX.writeFile(workbook, `relatorio-beneficios-${new Date().toISOString().split("T")[0]}.xlsx`);
};
