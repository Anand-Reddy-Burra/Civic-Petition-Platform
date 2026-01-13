import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, BarChart2, Download, ArrowLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { reportsAPI } from "@/lib/api";

// --- TYPE DEFINITION ---
type KpiMetricsType = {
  totalPetitions: number;
  totalPolls: number;
  totalEngagement: number;
};
type ChartDataType = {
  name: string;
  value: number;
  color?: string;
  volume?: number;
};
type PetitionChartType = "distribution" | "breakdown" | "sentiment";
type PollChartType = "distribution" | "status" | "sentiment";

// --- DATE FORMATTER ---
const formatDateForDisplay = (dateString: string, includeYear: boolean = true) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { month: "long" };
  if (includeYear) options.year = "numeric";
  return date.toLocaleDateString("en-US", options);
};

// --- LAST 12 MONTHS GENERATOR ---
const generateLast12Months = () => {
  const months = [];
  let currentDate = new Date();

  currentDate.setDate(1);

  for (let i = 0; i < 12; i++) {
    const dateValue = currentDate.toISOString().slice(0, 10);

    let dateDisplay = formatDateForDisplay(dateValue, false);
    if (i === 0) dateDisplay += "";

    months.push({ value: dateValue, label: dateDisplay });

    currentDate.setMonth(currentDate.getMonth() - 1);
  }
  return months;
};

const RAW_MONTH_OPTIONS = generateLast12Months();
const MONTH_OPTIONS = [
  { value: "all", label: "All time" },
  ...RAW_MONTH_OPTIONS,
];
const CURRENT_MONTH_VALUE = MONTH_OPTIONS[0].value;

// --- SIMULATED DATA ---
const COMMUNITY_DATA = {
  kpi: { totalPetitions: 145, totalPolls: 32, totalEngagement: 11200 },
  charts: [
    {
      id: 1,
      title: "Petition Categories Distribution",
      type: "pie",
      data: [
        { name: "Infrastructure (45%)", value: 45, color: "#FF8C00" },
        { name: "Environment (30%)", value: 30, color: "#28B463" },
        { name: "Public Safety (15%)", value: 15, color: "#8B0000" },
        { name: "Education (10%)", value: 10, color: "#2E86C1" },
      ],
      barColor: [],
    },
    {
      id: 2,
      title: "Petition Status Breakdown",
      type: "pie",
      data: [
        { name: "Active (70%)", value: 70, color: "#1f77b4" },
        { name: "Under Review (20%)", value: 20, color: "#ff7f0e" },
        { name: "Closed (10%)", value: 10, color: "#d62728" },
      ],
      barColor: [],
    },
    {
      id: 3,
      title: "Petition Options Sentiment (Yes/No)",
      type: "bar",
      data: [
        { name: "Yes Votes (70%)", volume: 70 },
        { name: "No Votes (30%)", volume: 30 },
      ],
      barColor: ["#28B463", "#8B0000"],
    },
    {
      id: 4,
      title: "Poll Status Breakdown",
      type: "pie",
      data: [
        { name: "Active (70%)", value: 70, color: "#2ca02c" },
        { name: "Under Review (15%)", value: 15, color: "#ff7f0e" },
        { name: "Closed (15%)", value: 15, color: "#9467bd" },
      ],
      barColor: [],
    },
    {
      id: 5,
      title: "Poll Options Sentiment (Agree/Disagree)",
      type: "bar",
      data: [
        { name: "Agree (60%)", volume: 60 },
        { name: "Disagree (40%)", volume: 40 },
      ],
      barColor: ["#1f77b4", "#d62728"],
    },
    {
      id: 6,
      title: "Poll Categories Distribution",
      type: "pie",
      data: [
        { name: "Social Issues (60%)", value: 60, color: "#9370DB" },
        { name: "Community Events (25%)", value: 25, color: "#008080" },
        { name: "Local Policy (15%)", value: 15, color: "#FFD700" },
      ],
      barColor: [],
    },
  ],
};

const MY_ACTIVITY_DATA = {
  kpi: { totalPetitions: 5, totalPolls: 4, totalEngagement: 15 },
  charts: [
    {
      id: 7,
      title: "My Petition Status Breakdown",
      type: "pie",
      data: [
        { name: "Active", value: 60, color: "#1f77b4" },
        { name: "Under Review", value: 20, color: "#ff7f0e" },
        { name: "Closed", value: 20, color: "#d62728" },
      ],
      barColor: [],
    },
    {
      id: 8,
      title: "My Polls Status Breakdown",
      type: "pie",
      data: [
        { name: "Active", value: 25, color: "#2ca02c" },
        { name: "Under Review", value: 25, color: "#ff7f0e" },
        { name: "Closed", value: 50, color: "#9467bd" },
      ],
      barColor: [],
    },
  ],
};

// --- RECHARTS CARD COMPONENT ---
const RechartsCard = ({
  chartType,
  data,
  barColor,
  pieRadius = 100,
}: {
  chartType: string;
  data: ChartDataType[];
  barColor: string[];
  pieRadius?: number;
}) => {
  if (!data || data.length === 0)
    return <div className="text-center text-gray-500">No data available.</div>;

  let ChartComponent = null;

  if (chartType === "bar") {
    ChartComponent = (
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          stroke="#696984"
          angle={-15}
          textAnchor="end"
          height={50}
          style={{ fontSize: "10px" }}
        />
        <YAxis stroke="#696984" domain={[0, 100]} style={{ fontSize: "10px" }} />
        <Tooltip />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: "10px", paddingTop: "5px", flexWrap: "wrap" }}
        />
        <Bar dataKey="volume" radius={[5, 5, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                Array.isArray(barColor) && barColor.length > index
                  ? barColor[index]
                  : "#8884d8"
              }
            />
          ))}
        </Bar>
      </BarChart>
    );
  } else if (chartType === "pie") {
    ChartComponent = (
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius={pieRadius} // responsive radius supplied by parent
          fill="#8884d8"
          paddingAngle={0}
          labelLine={false}
          label={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          iconType="circle"
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{
            fontSize: "11px",
            paddingTop: "10px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        />
      </PieChart>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {ChartComponent}
    </ResponsiveContainer>
  );
};

// --- KPI CARD COMPONENT ---
const KpiCard = ({
  title,
  value,
  Icon,
  bgColor,
  statChange,
}: {
  title: string;
  value: string;
  Icon: React.ComponentType<any>;
  bgColor: string;
  statChange: string;
}) => {
  let borderColor = "border-gray-100";
  if (bgColor.includes("red")) borderColor = "border-red-700";
  else if (bgColor.includes("blue")) borderColor = "border-blue-600";
  else if (bgColor.includes("green")) borderColor = "border-green-600";

  const statColor = "text-gray-500";

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between border-b-4 ${borderColor} border-opacity-30 transition-all duration-300 hover:shadow-2xl hover:border-opacity-100`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-semibold">{title}</p>
          <h2 className="text-4xl font-extrabold text-gray-800 mt-1">{value}</h2>
        </div>
        <div className={`p-3 rounded-full ${bgColor} text-white`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-3 text-sm flex items-center">
        <span className={`font-semibold ${statColor}`}>{statChange}</span>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function ReportDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"community" | "my_activity">(
    "community"
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    CURRENT_MONTH_VALUE
  );
  const [activePetitionChart, setActivePetitionChart] =
    useState<PetitionChartType>("distribution");
  const [activePollChart, setActivePollChart] =
    useState<PollChartType>("distribution");

  const [reportData, setReportData] = useState<any[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KpiMetricsType>({
    totalPetitions: 0,
    totalPolls: 0,
    totalEngagement: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [pieRadius, setPieRadius] = useState<number>(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    if (w >= 1400) return 140;
    if (w >= 1024) return 120;
    if (w >= 768) return 100;
    return 80;
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w >= 1400) setPieRadius(140);
      else if (w >= 1024) setPieRadius(120);
      else if (w >= 768) setPieRadius(100);
      else setPieRadius(80);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const scope = activeTab === "community" ? "community" : "my_activity";
      const res = await reportsAPI.getOverview(scope, selectedMonth);
      if (res?.success) {
        setReportData(res.data.charts || []);
        setKpiMetrics(
          res.data.kpi || {
            totalPetitions: 0,
            totalPolls: 0,
            totalEngagement: 0,
          }
        );
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      if (initialLoading) setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonth]);

  const handleExportPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      // @ts-ignore - html2pdf.js doesn't have type definitions
      const html2pdf = (await import('html2pdf.js')).default;
      
      if (!dashboardRef.current) return;

      const element = dashboardRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Reports_Dashboard_${activeTab}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const currentMonthLabel =
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ||
    "Current Month";

  const kpiData = [
    {
      title: "Total Petitions",
      value: kpiMetrics.totalPetitions.toLocaleString(),
      Icon: CheckCircle2,
      bgColor: "bg-red-700",
      statChange: activeTab === "community" ? "Community petitions" : "Your total petitions",
    },
    {
      title: "Total Polls",
      value: kpiMetrics.totalPolls.toLocaleString(),
      Icon: BarChart2,
      bgColor: "bg-blue-600",
      statChange: activeTab === "community" ? "Community polls" : "Your total polls",
    },
    {
      title: "Total Engagement",
      value: kpiMetrics.totalEngagement.toLocaleString(),
      Icon: Clock,
      bgColor: "bg-green-600",
      statChange: activeTab === "community" ? "Total community engagement" : "Your recent activity score",
    },
  ];

  if (initialLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium text-gray-700">
          Loading Reports...
        </div>
      </div>
    );

  const communityCharts = {
    petitionDistribution: reportData.find((c) => c.id === 1),
    petitionBreakdown: reportData.find((c) => c.id === 2),
    petitionSentiment: reportData.find((c) => c.id === 3),
    pollDistribution: reportData.find((c) => c.id === 6),
    pollStatus: reportData.find((c) => c.id === 4),
    pollSentiment: reportData.find((c) => c.id === 5),
    userActivity: reportData.find((c) => c.id === 9),
  };

  let activePetitionChartData = null;
  if (activeTab === "community") {
    const id =
      activePetitionChart === "distribution"
        ? 1
        : activePetitionChart === "breakdown"
        ? 2
        : 3;
    activePetitionChartData = reportData.find((c) => c.id === id);
  }

  let activePollChartData = null;
  if (activeTab === "community") {
    const id =
      activePollChart === "distribution"
        ? 6
        : activePollChart === "status"
        ? 4
        : 5;
    activePollChartData = reportData.find((c) => c.id === id);
  }

  const showPetitionNestedView =
    activeTab === "community" &&
    communityCharts.petitionDistribution &&
    communityCharts.petitionBreakdown &&
    communityCharts.petitionSentiment;

  const showPollNestedView =
    activeTab === "community" &&
    communityCharts.pollDistribution &&
    communityCharts.pollStatus &&
    communityCharts.pollSentiment;

  const myActivityCharts =
    activeTab === "my_activity"
      ? reportData.filter((item) => item.id === 7 || item.id === 8)
      : [];

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-8">
        <div className="w-full max-w-6xl" ref={dashboardRef}>
          {/* Header */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 text-black"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b pb-2">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-800 leading-tight">
                Reports & Analytics Dashboard
              </h1>
            </div>

            {/* Month Selector + Export */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="responsive-select text-foreground px-3 py-1.5 rounded-md border border-primary/30 bg-card font-semibold cursor-pointer appearance-none pr-8 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors w-full sm:w-auto max-w-full"
                style={{
                  background:
                    'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22hsl(177%2C%2030%25%2C%2026%25)%22%20stroke-width%3D%222%22%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E") no-repeat right 8px center',
                  maxWidth: "420px" 
                }}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <button 
                onClick={handleExportPDF}
                className="flex items-center justify-center text-foreground px-3 py-1.5 rounded-md hover:bg-primary/10 transition duration-300 border border-primary/30 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
              >
                <Download size={16} className="mr-2" /> Export Data
              </button>
            </div>
          </div>

          {/* Month Summary */}
          <p className="text-md text-gray-600 mb-8">
            Data displayed for <strong>{currentMonthLabel}</strong>.{" "}
            {activeTab === "community"
              ? " Track civic engagement and measure the impact of petitions and polls across the community."
              : " View your personal contribution and status of the petitions and polls you initiated."}
          </p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <KpiCard key={index} {...kpi} />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-300 mb-8">
            <button
              onClick={() => setActiveTab("community")}
              className={`py-2 px-4 font-semibold text-lg transition-colors duration-300 ${
                activeTab === "community"
                  ? "text-gray-800 border-b-4 border-gray-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Community Overview
            </button>

            <button
              onClick={() => setActiveTab("my_activity")}
              className={`py-2 px-4 font-semibold text-lg transition-colors duration-300 ${
                activeTab === "my_activity"
                  ? "text-gray-800 border-b-4 border-gray-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Activity
            </button>
          </div>

          {/* CHART GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Petition Nested View */}
            {showPetitionNestedView && (
              <div
                className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100"
                style={{ minHeight: 320 }}
              >
                <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                  Petition Analysis Overview
                </h2>

                {/* Petition Tabs */}
                <div className="flex space-x-4 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setActivePetitionChart("distribution")}
                    className={`py-1 px-3 text-sm font-medium transition-colors duration-300 ${
                      activePetitionChart === "distribution"
                        ? "text-red-700 border-b-2 border-red-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Distribution
                  </button>

                  <button
                    onClick={() => setActivePetitionChart("breakdown")}
                    className={`py-1 px-3 text-sm font-medium transition-colors duration-300 ${
                      activePetitionChart === "breakdown"
                        ? "text-red-700 border-b-2 border-red-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Status Breakdown
                  </button>
                </div>

                {/* Petition Chart */}
                <div className="pt-2 h-64 sm:h-72 md:h-96 lg:h-[500px]">
                  {activePetitionChartData ? (
                    <RechartsCard
                      chartType={activePetitionChartData.type}
                      data={activePetitionChartData.data}
                      barColor={activePetitionChartData.barColor}
                      pieRadius={pieRadius}
                    />
                  ) : (
                    <div className="text-center text-gray-500 pt-10">
                      Select a metric above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Poll Nested View */}
            {showPollNestedView && (
              <div
                className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100"
              >
                <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                  Poll Analysis Overview
                </h2>

                {/* Poll Tabs */}
                <div className="flex space-x-4 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setActivePollChart("distribution")}
                    className={`py-1 px-3 text-sm font-medium transition-colors duration-300 ${
                      activePollChart === "distribution"
                        ? "text-red-700 border-b-2 border-red-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Distribution
                  </button>

                  <button
                    onClick={() => setActivePollChart("status")}
                    className={`py-1 px-3 text-sm font-medium transition-colors duration-300 ${
                      activePollChart === "status"
                        ? "text-red-700 border-b-2 border-red-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Status Breakdown
                  </button>
                </div>

                {/* Poll Chart */}
                <div className="pt-2 h-64 sm:h-72 md:h-96 lg:h-[500px]">
                  {activePollChartData ? (
                    <RechartsCard
                      chartType={activePollChartData.type}
                      data={activePollChartData.data}
                      barColor={activePollChartData.barColor}
                      pieRadius={pieRadius}
                    />
                  ) : (
                    <div className="text-center text-gray-500 pt-10">
                      Select a metric above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Activity by Role Chart - Community View */}
            {activeTab === "community" && communityCharts.userActivity && (
              <div
                className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 lg:col-span-2"
              >
                <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                  {communityCharts.userActivity.title}
                </h2>
                <div className="pt-2 h-64 sm:h-80 md:h-96 lg:h-[400px]">
                  <RechartsCard
                    chartType={communityCharts.userActivity.type}
                    data={communityCharts.userActivity.data}
                    barColor={communityCharts.userActivity.barColor}
                    pieRadius={pieRadius}
                  />
                </div>
              </div>
            )}

            {/* My Activity Charts */}
            {activeTab === "my_activity" && myActivityCharts.length > 0 ? (
              myActivityCharts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100"
                >
                  <h2 className="text-xl font-semibold mb-6 text-gray-700 border-b pb-2">
                    {item.title}
                  </h2>
                  <div className="h-64 sm:h-72 md:h-96">
                    <RechartsCard
                      chartType={item.type}
                      data={item.data}
                      barColor={item.barColor}
                      pieRadius={pieRadius}
                    />
                  </div>
                </div>
              ))
            ) : activeTab === "my_activity" ? (
              <div className="lg:col-span-2 p-10 bg-white rounded-xl shadow-lg text-center text-xl text-gray-500">
                No activity data available for your personal reports.
              </div>
            ) : null}

            {/* Community Fallback */}
            {activeTab === "community" &&
              !showPetitionNestedView &&
              !showPollNestedView && (
                <div className="lg:col-span-2 p-10 bg-white rounded-xl shadow-lg text-center text-xl text-gray-500">
                  No community charts available for display.
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
