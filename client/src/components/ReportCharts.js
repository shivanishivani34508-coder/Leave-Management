import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function ReportCharts({ summary }) {

  const data = {
    labels: [
      "Approved",
      "Pending",
      "Rejected",
    ],

    datasets: [
      {
        label: "Leave Requests",

        data: [
          summary.approvedLeaves,
          summary.pendingLeaves,
          summary.rejectedLeaves,
        ],

        backgroundColor: [
          "#10b981",
          "#f59e0b",
          "#ef4444",
        ],

        borderWidth: 1,
      },
    ],
  };

  return (
    <div
      style={{
        width: "420px",
        margin: "30px auto",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        Leave Status Distribution
      </h2>

      <Pie data={data} />
    </div>
  );
}

export default ReportCharts;