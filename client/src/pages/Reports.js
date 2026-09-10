import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import api from "../services/api";

import "./Reports.css";

function Reports() {
  const navigate = useNavigate();

  /* ==========================================
      STATE
  ========================================== */

  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalLeaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
    rejectedLeaves: 0,
  });

  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  /* ==========================================
      AUTH CONFIG
  ========================================== */

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem(
        "token"
      )}`,
    },
  });

  /* ==========================================
      FETCH REPORTS
  ========================================== */

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const summaryResponse = await api.get(
        "/reports/summary",
        getAuthConfig()
      );

      setSummary(summaryResponse.data);

      const reportsResponse = await api.get(
        "/reports/all",
        getAuthConfig()
      );

      setReports(reportsResponse.data);

      setMessage("");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/");
        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ==========================================
      FILTER REPORTS
  ========================================== */

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const employee =
        report.employee?.name?.toLowerCase() || "";

      const matchesSearch =
        employee.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        report.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    reports,
    search,
    statusFilter,
  ]);
    /* ==========================================
      EXPORT PDF
  ========================================== */

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Leave Management Report", 14, 18);

    doc.setFontSize(11);
    doc.text(
      `Generated On : ${new Date().toLocaleString()}`,
      14,
      28
    );

    autoTable(doc, {
      startY: 38,

      head: [[
        "Employee",
        "Email",
        "Leave Type",
        "Start Date",
        "End Date",
        "Total",
        "Paid",
        "Unpaid",
        "Status",
      ]],

      body: filteredReports.map((report) => [
        report.employee?.name || "-",
        report.employee?.email || "-",
        report.leaveType,
        new Date(
          report.startDate
        ).toLocaleDateString(),
        new Date(
          report.endDate
        ).toLocaleDateString(),
        report.totalDays,
        report.paidDays,
        report.unpaidDays,
        report.status,
      ]),
    });

    doc.save("Leave_Report.pdf");
  };

  /* ==========================================
      EXPORT EXCEL
  ========================================== */

  const handleExportExcel = () => {

    const excelData = filteredReports.map(
      (report) => ({
        Employee:
          report.employee?.name || "-",

        Email:
          report.employee?.email || "-",

        "Leave Type":
          report.leaveType,

        "Start Date":
          new Date(
            report.startDate
          ).toLocaleDateString(),

        "End Date":
          new Date(
            report.endDate
          ).toLocaleDateString(),

        "Total Days":
          report.totalDays,

        "Paid Days":
          report.paidDays,

        "Unpaid Days":
          report.unpaidDays,

        Status:
          report.status,
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Leave Reports"
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

    const file = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      file,
      "Leave_Report.xlsx"
    );
  };

  /* ==========================================
      LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="reports-loading">
        <h2>Loading Reports...</h2>
      </div>
    );
  }
    /* ==========================================
      PAGE UI
  ========================================== */

  return (
    <div className="reports-page">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="reports-header">

        <div>
          <h1>📊 Reports Dashboard</h1>

          <p>
            View employee leave statistics and detailed reports.
          </p>
        </div>

        <button
          className="reports-refresh-btn"
          onClick={fetchReports}
        >
          🔄 Refresh
        </button>

      </div>

      {message && (
        <div className="reports-message">
          {message}
        </div>
      )}

      {/* ==========================================
          SUMMARY CARDS
      ========================================== */}

      <div className="reports-summary-grid">

        <div className="summary-card">
          <h3>Total Employees</h3>
          <h2>{summary.totalEmployees}</h2>
        </div>

        <div className="summary-card">
          <h3>Total Leaves</h3>
          <h2>{summary.totalLeaves}</h2>
        </div>

        <div className="summary-card approved">
          <h3>Approved Leaves</h3>
          <h2>{summary.approvedLeaves}</h2>
        </div>

        <div className="summary-card pending">
          <h3>Pending Leaves</h3>
          <h2>{summary.pendingLeaves}</h2>
        </div>

        <div className="summary-card rejected">
          <h3>Rejected Leaves</h3>
          <h2>{summary.rejectedLeaves}</h2>
        </div>

      </div>

      {/* ==========================================
          PIE CHART
      ========================================== */}

    

      {/* ==========================================
          SEARCH & FILTER
      ========================================== */}

      <div className="reports-toolbar">

        <input
          type="text"
          className="reports-search"
          placeholder="🔍 Search Employee..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          className="reports-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Approved">
            Approved
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Rejected">
            Rejected
          </option>

        </select>

      </div>

      {/* ==========================================
          REPORT TABLE
      ========================================== */}

      <div className="reports-table-container">

        <table className="reports-table">

          <thead>

            <tr>

              <th>Employee</th>
              <th>Email</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Unpaid</th>
              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {filteredReports.length === 0 ? (

              <tr>
                <td
                  colSpan="9"
                  className="no-data"
                >
                  No reports found.
                </td>
              </tr>

            ) : (

              filteredReports.map((report) => (

                <tr key={report._id}>

                  <td>{report.employee?.name}</td>

                  <td>{report.employee?.email}</td>

                  <td>{report.leaveType}</td>

                  <td>
                    {new Date(
                      report.startDate
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {new Date(
                      report.endDate
                    ).toLocaleDateString()}
                  </td>

                  <td>{report.totalDays}</td>

                  <td>{report.paidDays}</td>

                  <td>{report.unpaidDays}</td>

                  <td>

                    <span
                      className={`status ${report.status.toLowerCase()}`}
                    >
                      {report.status}
                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
            {/* ==========================================
          ACTION BUTTONS
      ========================================== */}

      <div className="reports-actions">

        <button
          className="export-btn excel-btn"
          onClick={handleExportExcel}
        >
          📥 Export Excel
        </button>

        <button
          className="export-btn pdf-btn"
          onClick={handleExportPDF}
        >
          📄 Export PDF
        </button>

        <button
          className="back-btn"
          onClick={() => navigate("/admin-dashboard")}
        >
          ⬅ Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default Reports;