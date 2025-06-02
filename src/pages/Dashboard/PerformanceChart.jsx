import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";

const PerformanceChart = ({ name, data, handle }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current || !data || data.length === 0) {
      return;
    }

    const ctx = chartRef.current.getContext("2d");

    // Make canvas background transparent
    ctx.globalCompositeOperation = "source-over";

    // Filter out null values and prepare data
    const filteredData = data.filter(
      (point) => point.y !== null && point.x !== null
    );

    if (filteredData.length === 0) {
      // Show "No data" message with transparent background
      ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
      ctx.fillStyle = "#6b7280";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        "No contest data available",
        chartRef.current.width / 2,
        chartRef.current.height / 2
      );
      return;
    }

    // Create gradient for area under the curve (fill from bottom)
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.4)");

    // Detect theme for colors
    const isDarkMode = document.documentElement.classList.contains("dark");
    const legendColor = isDarkMode ? "#e5e7eb" : "#374151";
    const titleColor = isDarkMode ? "#9ca3af" : "#6b7280";
    const gridColor = isDarkMode ? "#374151" : "#e5e7eb";
    const tickColor = isDarkMode ? "#9ca3af" : "#6b7280";

    // Set canvas style to ensure transparent background
    if (chartRef.current) {
      chartRef.current.style.backgroundColor = "transparent";
    }

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: `Contest Rank`,
            data: filteredData,
            borderColor: "#3b82f6",
            backgroundColor: gradient,
            borderWidth: 3,
            fill: "start", // Fill from the start (bottom) of the chart
            tension: 0.4,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#1d4ed8",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 10,
            bottom: 10,
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        onHover: (event, activeElements) => {
          // Prevent chart from moving when hovering over legend
          event.native.target.style.cursor =
            activeElements.length > 0 ? "pointer" : "default";
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            onClick: () => {
              // Disable legend click to prevent chart toggle
              return false;
            },
            labels: {
              color: legendColor,
              font: {
                size: window.innerWidth < 768 ? 12 : 14,
                weight: "500",
              },
              padding: window.innerWidth < 768 ? 10 : 20,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#3b82f6",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            titleFont: {
              size: window.innerWidth < 768 ? 12 : 14,
              weight: "600",
            },
            bodyFont: {
              size: window.innerWidth < 768 ? 11 : 13,
            },
            padding: window.innerWidth < 768 ? 8 : 12,
            callbacks: {
              title: function (context) {
                const date = new Date(context[0].parsed.x);
                return date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              },
              label: function (context) {
                return `Rank: #${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              displayFormats: {
                day: window.innerWidth < 768 ? "MMM dd" : "MMM dd",
              },
            },
            title: {
              display: true,
              text: "Contest Date",
              color: titleColor,
              font: {
                size: window.innerWidth < 768 ? 10 : 12,
                weight: "500",
              },
            },
            grid: {
              color: gridColor,
              lineWidth: 1,
            },
            ticks: {
              color: tickColor,
              font: {
                size: window.innerWidth < 768 ? 9 : 11,
              },
              maxTicksLimit: window.innerWidth < 768 ? 4 : 8,
              maxRotation: window.innerWidth < 768 ? 45 : 0,
            },
          },
          y: {
            position: "left",
            reverse: true, // Lower rank number = better performance
            title: {
              display: true,
              text: "Contest Rank",
              color: titleColor,
              font: {
                size: window.innerWidth < 768 ? 10 : 12,
                weight: "500",
              },
            },
            grid: {
              color: gridColor,
              lineWidth: 1,
            },
            ticks: {
              color: tickColor,
              font: {
                size: window.innerWidth < 768 ? 9 : 11,
              },
              callback: function (value) {
                return "#" + value;
              },
            },
          },
        },
        elements: {
          point: {
            hoverBorderWidth: 3,
          },
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, name]);

  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            No contest data available
          </p>
          {handle && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1">
              Handle: {handle}
            </p>
          )}
        </div>
      </div>
    );
  }

  const validDataPoints = data.filter(
    (point) => point.y !== null && point.x !== null
  ).length;

  return (
    <div className="w-full h-full relative bg-transparent">
      <div className="w-full h-[100%] flex justify-center items-center">
        <div className="w-[130%] h-full relative bg-transparent">
          <canvas
            ref={chartRef}
            className="w-full h-full bg-transparent"
            style={{ backgroundColor: "transparent" }}
          ></canvas>
        </div>
      </div>

      {/* Chart Info - Mobile responsive */}
      <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1 md:py-2 shadow-md border border-gray-200/50 dark:border-gray-600/50">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div>Contests: {validDataPoints}</div>
          {handle && <div className="hidden md:block">Handle: {handle}</div>}
        </div>
      </div>

      {validDataPoints === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
          <div className="text-center px-4 bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              No contest participation data found
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start participating in contests to see your progress!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;
