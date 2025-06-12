import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ChartComponent = ({ data, chartType = 'bar', height = 300 }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Extract keys from first data item (excluding common non-numeric fields)
    const firstItem = data[0];
    const excludeKeys = ['_id', 'id', 'name', 'title', 'description', 'category', 'type', 'date'];
    
    const numericKeys = Object.keys(firstItem).filter(key => {
      const value = firstItem[key];
      return typeof value === 'number' && !excludeKeys.includes(key);
    });

    const stringKeys = Object.keys(firstItem).filter(key => {
      const value = firstItem[key];
      return typeof value === 'string' && !excludeKeys.includes(key);
    });

    // Prioritize 'state' as label if available, otherwise use first string field
    let labelKey = 'state';
    if (!stringKeys.includes('state')) {
      labelKey = stringKeys[0] || Object.keys(firstItem)[0];
    }

    // Choose the most relevant numeric field based on dataset
    let dataKey = numericKeys[0];
    
    // Smart field selection based on available fields
    if (numericKeys.includes('cases_reported')) {
      dataKey = 'cases_reported';
    } else if (numericKeys.includes('literacy_rate')) {
      dataKey = 'literacy_rate';
    } else if (numericKeys.includes('avg_aqi')) {
      dataKey = 'avg_aqi';
    } else if (numericKeys.includes('deaths')) {
      dataKey = 'deaths';
    }

    if (!dataKey) return null;

    // Group data by state for better visualization when we have multiple states
    const groupedData = {};
    data.forEach(item => {
      const label = item[labelKey]?.toString() || `Item ${data.indexOf(item) + 1}`;
      const value = typeof item[dataKey] === 'number' ? item[dataKey] : 0;
      
      if (!groupedData[label]) {
        groupedData[label] = [];
      }
      groupedData[label].push(value);
    });

    // Calculate aggregated values (average for multiple years, sum for single year)
    const labels = Object.keys(groupedData);
    const values = labels.map(label => {
      const values = groupedData[label];
      // If we have multiple values for same state (multiple years), take average
      // If we have single value, use it directly
      return values.length > 1 ? 
        values.reduce((sum, val) => sum + val, 0) / values.length :
        values[0];
    });

    // Sort by values for better visualization (descending order)
    const sortedIndices = values
      .map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value)
      .map(item => item.index);

    const sortedLabels = sortedIndices.map(i => labels[i]);
    const sortedValues = sortedIndices.map(i => values[i]);

    // Limit to top 15 states for better readability in charts
    const maxItems = chartType === 'pie' || chartType === 'doughnut' ? 8 : 15;
    const finalLabels = sortedLabels.slice(0, maxItems);
    const finalValues = sortedValues.slice(0, maxItems);

    // Color schemes for different chart types
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(34, 211, 238, 0.8)',   // Cyan
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(168, 85, 247, 0.8)',   // Violet
      'rgba(20, 184, 166, 0.8)',   // Teal
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(156, 163, 175, 0.8)',  // Gray
      'rgba(34, 197, 94, 0.8)',    // Green alt
      'rgba(217, 70, 239, 0.8)',   // Fuchsia
      'rgba(99, 102, 241, 0.8)',   // Indigo
      'rgba(244, 63, 94, 0.8)'     // Rose
    ];

    const borderColors = colors.map(color => color.replace('0.8', '1'));

    if (chartType === 'pie' || chartType === 'doughnut') {
      return {
        labels: finalLabels,
        datasets: [{
          label: dataKey.replace('_', ' ').toUpperCase(),
          data: finalValues,
          backgroundColor: colors.slice(0, finalLabels.length),
          borderColor: borderColors.slice(0, finalLabels.length),
          borderWidth: 2,
        }]
      };
    }

    return {
      labels: finalLabels,
      datasets: [{
        label: dataKey.replace('_', ' ').toUpperCase(),
        data: finalValues,
        backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : colors.slice(0, finalLabels.length),
        borderColor: chartType === 'line' ? borderColors[0] : borderColors.slice(0, finalLabels.length),
        borderWidth: 2,
        fill: chartType === 'line',
        tension: chartType === 'line' ? 0.4 : undefined,
      }]
    };
  }, [data, chartType]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#F1F5F9',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#F1F5F9',
        bodyColor: '#F1F5F9',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
      }
    },
    scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
      x: {
        ticks: {
          color: '#94A3B8',
          font: {
            size: 10
          },
          maxRotation: 45,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        }
      },
      y: {
        ticks: {
          color: '#94A3B8',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        }
      }
    } : undefined,
  }), [chartType]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">No data available for visualization</div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />;
      case 'bar':
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {renderChart()}
    </div>
  );
};

export default ChartComponent;
