import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const PerformanceChart = (props) => {
  const chartRef = useRef(null);
  const charInstance = useRef(null);

  useEffect(() => {
    if (charInstance.current) {
      charInstance.current.destroy();
    }
    const myChartRef = chartRef.current.getContext("2d");

    charInstance.current = new Chart(myChartRef, {
      type: "line",
      data: {
        labels: props.timeData,
        datasets: [
          {
            label: `${props.name}'s Percentile Different Contests`,
            data: props.rankData,
            borderColor: "gray",
            fill: false,
          },
        ],
      },
    });
    return () => {
      if (charInstance.current) {
        charInstance.current.destroy();
      }
    };
  }, [props.timeData, props.rankData]);

  return (
    <div>
      <canvas ref={chartRef} width="400" height="200"></canvas>
    </div>
  );
};

export default PerformanceChart;
