import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import 'chartjs-adapter-date-fns';

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
      responsive: true,
      data: {
        labels: props.timeData,
        datasets: [
          {
            label: `${props.name}'s Rank`,
            data: props.data,
            borderColor: "gray",
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            }
          },
          y: {
           position:'left',
           reverse:'true'
          }
        }
      },
    });
    return () => {
      if (charInstance.current) {
        charInstance.current.destroy();
      }
    };
  }, [props.data]);

  return (
    <div className="w-full h-full">
    <canvas ref={chartRef} className="w-full h-full"></canvas>
  </div>
  );
};

export default PerformanceChart;